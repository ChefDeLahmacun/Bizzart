"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addProductAction(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    console.log("SESSION IN SERVER ACTION:", session);

    if (!session || session.user?.role !== "ADMIN" || !session.user?.id) {
      throw new Error("Unauthorized");
    }

    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const price = parseFloat(formData.get("price") as string);
    const stock = parseInt(formData.get("stock") as string, 10);
    const categoryId = formData.get("categoryId") as string;
    const images = formData.getAll("images") as File[];

    // Create the product first
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        userId: session.user.id,
      },
    });

    // Handle media uploads
    if (images.length > 0) {
      const processedMedia = await Promise.all(
        images.map(async (media) => {
          // Convert File to base64 string
          const buffer = Buffer.from(await media.arrayBuffer());
          const base64 = buffer.toString('base64');
          const type = media.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
          return {
            url: `data:${media.type};base64,${base64}` as string,
            type,
          };
        })
      );
      // Create media records
      await prisma.image.createMany({
        data: processedMedia.map((media) => ({
          url: media.url,
          productId: product.id,
          type: media.type,
        })),
      });
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to add product:", error);
    return { error: "Failed to add product" };
  }
} 