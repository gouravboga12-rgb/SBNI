import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuthenticatedRequest } from '../middlewares/auth';

export const getBanners = async (req: Request, res: Response) => {
  const audience = (req.query.audience as string) || 'ALL';

  const banners = await prisma.banner.findMany({
    where: {
      isActive: true,
      targetAudience: { in: ['ALL', audience] },
    },
    orderBy: { displayOrder: 'asc' },
  });

  res.json({ success: true, count: banners.length, data: banners });
};

export const getFAQs = async (req: Request, res: Response) => {
  const category = req.query.category as string;

  const faqs = await prisma.fAQ.findMany({
    where: {
      isActive: true,
      category: category ? { equals: category, mode: 'insensitive' } : undefined,
    },
    orderBy: { displayOrder: 'asc' },
  });

  res.json({ success: true, count: faqs.length, data: faqs });
};

export const getBlogs = async (req: Request, res: Response) => {
  const blogs = await prisma.blog.findMany({
    where: { isPublished: true },
    orderBy: { publishedAt: 'desc' },
  });

  res.json({ success: true, count: blogs.length, data: blogs });
};

export const getBlogBySlug = async (req: Request, res: Response) => {
  const { slug } = req.params;
  const blog = await prisma.blog.findUnique({ where: { slug } });

  if (!blog || !blog.isPublished) {
    return res.status(404).json({ success: false, message: 'Blog post not found.' });
  }

  res.json({ success: true, data: blog });
};

export const getTestimonials = async (req: Request, res: Response) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
  });

  res.json({ success: true, count: testimonials.length, data: testimonials });
};

export const getCMSPage = async (req: Request, res: Response) => {
  const { key } = req.params;
  const page = await prisma.cMSPage.findUnique({ where: { pageKey: key } });

  if (!page || !page.isPublished) {
    return res.status(404).json({ success: false, message: 'CMS Page not found.' });
  }

  res.json({ success: true, data: page });
};

export const getPlatformSettings = async (req: Request, res: Response) => {
  const settings = await prisma.platformSetting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => {
    settingsMap[s.key] = s.value;
  });

  res.json({ success: true, data: settingsMap });
};

export const createSupportTicket = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;
  const { subject, category, priority, message } = req.body;

  if (!subject || !message) {
    return res.status(400).json({ success: false, message: 'Subject and message are required.' });
  }

  const ticketNumber = 'TICK-' + Math.floor(100000 + Math.random() * 900000);

  const ticket = await prisma.supportTicket.create({
    data: {
      userId: userId!,
      ticketNumber,
      subject,
      category: category || 'General',
      priority: priority || 'MEDIUM',
      message,
    },
  });

  res.status(201).json({ success: true, message: 'Support ticket submitted successfully.', data: ticket });
};

export const getMyNotifications = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.userId;

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 30,
  });

  res.json({ success: true, count: notifications.length, data: notifications });
};
