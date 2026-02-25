import prisma from '../services/prisma.service.js';

export async function addReview(req, res, next) {
  try {
    const workshopId = parseInt(req.params.workshopId);

    const workshop = await prisma.workshop.findUnique({ where: { id: workshopId } });
    if (!workshop) {
      const error = new Error('Workshop not found');
      error.status = 404;
      throw error;
    }

    const review = await prisma.review.create({
      data: {
        rating: req.body.rating,
        comment: req.body.comment,
        status: 'pending',
        workshopId,
        userId: req.user.userId
      },
      include: {
        user: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(review);
  } catch (error) {
    next(error);
  }
}

export async function getWorkshopReviews(req, res, next) {
  try {
    const workshopId = parseInt(req.params.workshopId);

    const reviews = await prisma.review.findMany({
      where: { workshopId, status: 'approved' },
      include: {
        user: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const averageRating = reviews.length
      ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(2))
      : 0;

    res.json({
      averageRating,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      where: { userId: req.user.userId },
      include: {
        workshop: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
}

export async function updateReviewStatus(req, res, next) {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      const error = new Error('Status must be approved or rejected');
      error.status = 400;
      throw error;
    }

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      const error = new Error('Review not found');
      error.status = 404;
      throw error;
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: {
        user: { select: { id: true, name: true } },
        workshop: { select: { id: true, name: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    next(error);
  }
}

export async function getPendingReviews(req, res, next) {
  try {
    const reviews = await prisma.review.findMany({
      where: { status: 'pending' },
      include: {
        user: { select: { id: true, name: true } },
        workshop: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
}
