"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { fileUploadService } from "@/lib/upload";
import { MediaType } from "@prisma/client";

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

    // Handle size specifications (optional)
    const height = formData.get("height") ? parseFloat(formData.get("height") as string) : null;
    const width = formData.get("width") ? parseFloat(formData.get("width") as string) : null;
    const depth = formData.get("depth") ? parseFloat(formData.get("depth") as string) : null;
    const diameter = formData.get("diameter") ? parseFloat(formData.get("diameter") as string) : null;
    const weight = formData.get("weight") ? parseFloat(formData.get("weight") as string) : null;

    // Create the product first
    const product = await prisma.product.create({
      data: {
        name,
        description,
        price,
        stock,
        categoryId,
        userId: session.user.id,
        // Size specifications
        height,
        width,
        depth,
        diameter,
        weight,
      },
    });

    // Handle media uploads
    if (images.length > 0) {
      const uploadResults = await Promise.all(
        images.map(async (file, index) => {
          const result = await fileUploadService.uploadFile(file, 'products');
          if (!result.success) {
            throw new Error(`Failed to upload ${file.name}: ${result.error}`);
          }
          
          return {
            url: result.url,
            type: file.type.startsWith('video/') ? MediaType.VIDEO : MediaType.IMAGE,
            order: index,
          };
        })
      );

      // Create media records
      await prisma.image.createMany({
        data: uploadResults.map((media) => ({
          url: media.url,
          productId: product.id,
          type: media.type,
          order: media.order,
        })),
      });
    }

    revalidatePath("/admin/products");
    return { success: true };
  } catch (error) {
    console.error("Failed to add product:", error);
    return { error: error instanceof Error ? error.message : "Failed to add product" };
  }
} 