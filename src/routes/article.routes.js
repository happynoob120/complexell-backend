const express = require("express");
const { body } = require("express-validator");

const router = express.Router();

const protect = require("../middlewares/auth.middleware");

const {
  createArticle,
  getArticles,
  getArticleBySlug,
  updateArticle,
  deleteArticle,
  getMyArticles,
  getArticleForEdit,
  getFeaturedArticle,
} = require("../controllers/article.controller");

router.get("/", getArticles);

router.get("/mine", protect, getMyArticles);
router.get("/featured", getFeaturedArticle);
router.get("/edit/:id", protect, getArticleForEdit);
router.get("/:slug", getArticleBySlug);
router.post(
  "/",
  protect,
  [
    body("article_title")
      .trim()
      .notEmpty()
      .withMessage("Article title is required.")
      .isLength({ min: 5, max: 150 })
      .withMessage("Title must be between 5 and 150 characters."),

    body("article_context")
      .trim()
      .notEmpty()
      .withMessage("Article context is required.")
      .isLength({ min: 20, max: 300 })
      .withMessage("Context must be between 20 and 300 characters."),

    body("article_content")
      .notEmpty()
      .withMessage("Article content is required."),
  ],
  createArticle,
);

router.patch(
  "/:id",
  protect,
  [
    body("article_title")
      .trim()
      .notEmpty()
      .withMessage("Article title is required.")
      .isLength({ min: 5, max: 150 })
      .withMessage("Title must be between 5 and 150 characters."),

    body("article_context")
      .trim()
      .notEmpty()
      .withMessage("Article context is required.")
      .isLength({ min: 20, max: 300 })
      .withMessage("Context must be between 20 and 300 characters."),

    body("article_content")
      .notEmpty()
      .withMessage("Article content is required."),
  ],
  updateArticle,
);

router.delete("/:id", protect, deleteArticle);

module.exports = router;
