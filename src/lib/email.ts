import nodemailer from 'nodemailer';
import { Order, User, Product } from '@prisma/client';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Email templates
const emailTemplates = {
  orderConfirmation: (order: Order, user: User, products: any[]) => ({
    subject: `Order Confirmation #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Thank you for your order!</h2>
        <p>Dear ${user.name || 'Valued Customer'},</p>
        <p>Your order has been successfully placed and is being processed.</p>
        
        <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Order Details</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Order Date:</strong> ${new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
          <p><strong>Total Amount:</strong> ₺${order.totalAmount.toFixed(2)}</p>
          <p><strong>Status:</strong> ${order.status}</p>
        </div>
        
        <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Products</h3>
          ${products.map(product => `
            <div style="border-bottom: 1px solid #eee; padding: 10px 0;">
              <p><strong>${product.name}</strong></p>
              <p>Quantity: ${product.quantity}</p>
              <p>Price: ₺${product.price.toFixed(2)}</p>
            </div>
          `).join('')}
        </div>
        
        <p>We'll keep you updated on your order status. If you have any questions, please don't hesitate to contact us.</p>
        <p>Best regards,<br>Bizzart Team</p>
      </div>
    `
  }),
  
  orderStatusUpdate: (order: Order, user: User, newStatus: string) => ({
    subject: `Order Status Update #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order Status Update</h2>
        <p>Dear ${user.name || 'Valued Customer'},</p>
        <p>Your order status has been updated.</p>
        
        <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Order Information</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>New Status:</strong> <span style="color: #007bff; font-weight: bold;">${newStatus}</span></p>
          <p><strong>Total Amount:</strong> ₺${order.totalAmount.toFixed(2)}</p>
        </div>
        
        <p>We're working hard to get your order to you as soon as possible.</p>
        <p>Best regards,<br>Bizzart Team</p>
      </div>
    `
  }),
  
  orderCompleted: (order: Order, user: User) => ({
    subject: `Order Completed #${order.id}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Order Completed!</h2>
        <p>Dear ${user.name || 'Valued Customer'},</p>
        <p>Great news! Your order has been completed and delivered.</p>
        
        <div style="background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px;">
          <h3 style="margin-top: 0;">Order Information</h3>
          <p><strong>Order ID:</strong> #${order.id}</p>
          <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString('tr-TR')}</p>
          <p><strong>Total Amount:</strong> ₺${order.totalAmount.toFixed(2)}</p>
        </div>
        
        <p>Thank you for choosing Bizzart! We hope you love your handcrafted pottery.</p>
        <p>Best regards,<br>Bizzart Team</p>
      </div>
    `
  })
};

// Email sending functions
export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const mailOptions = {
      from: process.env.SMTP_USER,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendOrderConfirmation = async (order: Order, user: User, products: any[]) => {
  const template = emailTemplates.orderConfirmation(order, user, products);
  return await sendEmail(user.email, template.subject, template.html);
};

export const sendOrderStatusUpdate = async (order: Order, user: User, newStatus: string) => {
  const template = emailTemplates.orderStatusUpdate(order, user, newStatus);
  return await sendEmail(user.email, template.subject, template.html);
};

export const sendOrderCompleted = async (order: Order, user: User) => {
  const template = emailTemplates.orderCompleted(order, user);
  return await sendEmail(user.email, template.subject, template.html);
};

// Test email function
export const testEmail = async () => {
  try {
    const result = await transporter.verify();
    console.log('SMTP connection verified:', result);
    return { success: true, message: 'SMTP connection verified' };
  } catch (error) {
    console.error('SMTP verification failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
