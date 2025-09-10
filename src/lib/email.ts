import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Email templates
const emailTemplates = {
  orderConfirmation: (order: any, user: any, products: any[]) => ({
    subject: `🎨 Order Confirmation - Bizzart Handcrafted Pottery`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation - Bizzart</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">🎨 Bizzart</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Handcrafted Pottery & Art</p>
          </div>
          
          <!-- Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Thank you for your order!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${user?.name || 'Valued Customer'},</p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Your order has been successfully placed and is being processed. We're excited to prepare your handcrafted pottery!</p>
            
            <!-- Order Details -->
            <div style="background: #f8f9fa; padding: 25px; margin: 30px 0; border-radius: 10px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">📋 Order Details</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</p>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600; font-size: 16px;">#${order.id?.substring(0, 8).toUpperCase()}</p>
                </div>
                <div>
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Order Date</p>
                  <p style="margin: 0; color: #2c3e50; font-weight: 600; font-size: 16px;">${new Date(order.createdAt).toLocaleDateString('tr-TR')}</p>
                </div>
                <div>
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Total Amount</p>
                  <p style="margin: 0; color: #27ae60; font-weight: 700; font-size: 18px;">₺${order.totalAmount?.toFixed(2)}</p>
                </div>
                <div>
                  <p style="margin: 0 0 8px 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Status</p>
                  <p style="margin: 0; color: #f39c12; font-weight: 600; font-size: 16px; text-transform: capitalize;">${order.status}</p>
                </div>
              </div>
            </div>
            
            <!-- Products -->
            <div style="background: #f8f9fa; padding: 25px; margin: 30px 0; border-radius: 10px;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">🛍️ Your Items</h3>
              ${products.map((product, index) => {
                console.log('Email template product:', {
                  name: product.name,
                  image: product.image,
                  quantity: product.quantity,
                  price: product.price
                });
                
                return `
                <div style="display: flex; align-items: center; padding: 20px 0; border-bottom: ${index < products.length - 1 ? '1px solid #e9ecef' : 'none'};">
                  <div style="width: 80px; height: 80px; background: #e9ecef; border-radius: 8px; margin-right: 20px; display: flex; align-items: center; justify-content: center; overflow: hidden;">
                    ${product.image ? `
                      <img src="${product.image}" alt="${product.name}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
                    ` : `
                      <div style="color: #6c757d; font-size: 24px;">🏺</div>
                    `}
                  </div>
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 8px 0; color: #2c3e50; font-size: 18px; font-weight: 600;">${product.name}</h4>
                    <p style="margin: 0 0 8px 0; color: #666; font-size: 14px;">Quantity: ${product.quantity}</p>
                    <p style="margin: 0; color: #27ae60; font-weight: 700; font-size: 16px;">₺${product.price?.toFixed(2)}</p>
                  </div>
                </div>
              `;
              }).join('')}
            </div>
            
            <!-- Next Steps -->
            <div style="background: #e8f5e8; padding: 25px; margin: 30px 0; border-radius: 10px; border-left: 4px solid #27ae60;">
              <h3 style="margin: 0 0 15px 0; color: #2c3e50; font-size: 18px;">📦 What's Next?</h3>
              <ul style="margin: 0; padding-left: 20px; color: #555; line-height: 1.6;">
                <li>We'll prepare your handcrafted pottery with care</li>
                <li>You'll receive updates on your order status</li>
                <li>Your items will be carefully packaged and shipped</li>
              </ul>
            </div>
            
            <!-- Contact Info -->
            <div style="text-align: center; margin: 40px 0 20px 0; padding: 20px; background: #f8f9fa; border-radius: 10px;">
              <p style="margin: 0 0 10px 0; color: #555; font-size: 16px;">Questions about your order?</p>
              <p style="margin: 0; color: #667eea; font-weight: 600; font-size: 16px;">📧 support@bizzart4u.com</p>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Thank you for choosing Bizzart!</p>
              <p style="margin: 0; color: #999; font-size: 12px;">© 2024 Bizzart. All rights reserved.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  orderStatusUpdate: (order: any, user: any, newStatus: string) => ({
    subject: `📦 Order Status Update - Bizzart`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Status Update - Bizzart</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">🎨 Bizzart</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Handcrafted Pottery & Art</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 24px;">Order Status Update</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${user?.name || 'Valued Customer'},</p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Your order status has been updated.</p>
            <div style="background: #f8f9fa; padding: 25px; margin: 30px 0; border-radius: 10px; border-left: 4px solid #667eea;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">📋 Order Information</h3>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Order ID: <strong style="color: #2c3e50;">#${order.id?.substring(0, 8).toUpperCase()}</strong></p>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">New Status: <strong style="color: #007bff; font-size: 16px;">${newStatus}</strong></p>
              <p style="margin: 0; color: #666; font-size: 14px;">Total Amount: <strong style="color: #27ae60; font-size: 16px;">₺${order.totalAmount?.toFixed(2)}</strong></p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 30px 0;">We're working hard to get your order to you as soon as possible.</p>
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666; font-size: 14px;">Best regards,<br>Bizzart Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }),
  
  orderCompleted: (order: any, user: any) => ({
    subject: `🎉 Order Completed - Bizzart`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Completed - Bizzart</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f8f9fa; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%); padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300;">🎨 Bizzart</h1>
            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Handcrafted Pottery & Art</p>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #27ae60; margin: 0 0 20px 0; font-size: 24px;">🎉 Order Completed!</h2>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">Dear ${user?.name || 'Valued Customer'},</p>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">Great news! Your order has been completed and delivered.</p>
            <div style="background: #f8f9fa; padding: 25px; margin: 30px 0; border-radius: 10px; border-left: 4px solid #27ae60;">
              <h3 style="margin: 0 0 20px 0; color: #2c3e50; font-size: 20px;">📋 Order Information</h3>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Order ID: <strong style="color: #2c3e50;">#${order.id?.substring(0, 8).toUpperCase()}</strong></p>
              <p style="margin: 0 0 10px 0; color: #666; font-size: 14px;">Completion Date: <strong style="color: #2c3e50;">${new Date().toLocaleDateString('tr-TR')}</strong></p>
              <p style="margin: 0; color: #666; font-size: 14px;">Total Amount: <strong style="color: #27ae60; font-size: 16px;">₺${order.totalAmount?.toFixed(2)}</strong></p>
            </div>
            <p style="color: #555; font-size: 16px; line-height: 1.6; margin: 30px 0;">Thank you for choosing Bizzart! We hope you love your handcrafted pottery.</p>
            <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; color: #666; font-size: 14px;">Best regards,<br>Bizzart Team</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  })
};

// Email sending functions
export const sendEmail = async (to: string, subject: string, html: string, from?: string) => {
  try {
    const mailOptions = {
      from: from || process.env.SMTP_USER,
      to,
      subject,
      html,
      headers: {
        'X-Mailer': 'Bizzart E-commerce System',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'X-Entity-Ref-ID': '1',
        'X-Report-Abuse': 'Please report abuse to support@bizzart4u.com',
        'List-Unsubscribe': '<mailto:unsubscribe@bizzart4u.com>',
        'List-Id': 'Bizzart Orders <orders.bizzart4u.com>',
        'X-Auto-Response-Suppress': 'All',
        'Precedence': 'bulk',
        'Return-Path': 'noreply@bizzart4u.com'
      },
      envelope: {
        from: from || process.env.SMTP_USER,
        to: to
      }
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

export const sendOrderConfirmation = async (order: any, user: any, products: any[]) => {
  const template = emailTemplates.orderConfirmation(order, user, products);
  return await sendEmail(user.email, template.subject, template.html, 'sales@bizzart4u.com');
};

export const sendOrderStatusUpdate = async (order: any, user: any, newStatus: string) => {
  const template = emailTemplates.orderStatusUpdate(order, user, newStatus);
  return await sendEmail(user.email, template.subject, template.html, 'sales@bizzart4u.com');
};

export const sendOrderCompleted = async (order: any, user: any) => {
  const template = emailTemplates.orderCompleted(order, user);
  return await sendEmail(user.email, template.subject, template.html, 'sales@bizzart4u.com');
};

// Test email function
export const testEmail = async () => {
  try {
    const result = await transporter.verify();
    return { success: true, message: 'SMTP connection verified' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
