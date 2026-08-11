const Article = require("../models/article.model");
const { validationResult } = require("express-validator");

const createArticle = async (req, res) => {
  try {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { article_title, article_context, article_content } = req.body;
    if (!article_title || !article_context || !article_content) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const unique = Date.now().toString(36);

    const slug =
      article_title
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-") +
      "-" +
      unique;
    const article = await Article.create({
      article_title,
      article_context,
      article_content,

      slug,

      author: req.user.id,

      isPublished: true,

      publishedAt: new Date(),
    });

    return res.status(201).json({
      success: true,
      message: "Article published successfully.",
      article,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const getArticles = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 6;
    const q = req.query.q ? String(req.query.q).trim() : null;

    const skip = (page - 1) * limit;

    // Build query filter; support search over title and context when `q` provided
    const filter = { isPublished: true };

    if (q) {
      filter.$or = [
        { article_title: { $regex: q, $options: "i" } },
        { article_context: { $regex: q, $options: "i" } },
      ];
    }

    const articles = await Article.find(filter)
      .populate("author", "username")
      .sort({ publishedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalArticles = await Article.countDocuments(filter);

    return res.status(200).json({
      success: true,
      page,
      totalArticles,
      hasMore: skip + articles.length < totalArticles,
      articles,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getArticleBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    const article = await Article.findOne({
      slug,
      isPublished: true,
    }).populate("author", "username");

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    article.views += 1;
    await article.save();

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { article_title, article_context, article_content } = req.body;
    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }
    if (article.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to edit this article.",
      });
    }

    article.article_title = article_title;
    article.article_context = article_context;
    article.article_content = article_content;

    await article.save();

    return res.status(200).json({
      success: true,
      message: "Article updated successfully.",
      article,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;

    const article = await Article.findById(id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    if (article.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to delete this article.",
      });
    }

    await Article.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Article deleted successfully.",
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
const getMyArticles = async (req, res) => {
  try {
    const articles = await Article.find({
      author: req.user.id,
    })
      .populate("author", "username")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalArticles: articles.length,
      articles,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your articles.",
    });
  }
};
const getArticleForEdit = async (req, res) => {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "Article not found.",
      });
    }

    if (article.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized.",
      });
    }

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch article.",
    });
  }
};
const getFeaturedArticle = async (req, res) => {
  try {
    const article = await Article.findOne()
      .populate("author", "username")
      .sort({ views: -1, createdAt: -1 });

    if (!article) {
      return res.status(404).json({
        success: false,
        message: "No featured article found.",
      });
    }

    return res.status(200).json({
      success: true,
      article,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch featured article.",
    });
  }
};

module.exports = {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  getMyArticles,
  getArticleForEdit,
  getFeaturedArticle,
};
