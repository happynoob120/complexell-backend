const mongoose = require("mongoose");

const articleSchema = new mongoose.Schema(
  {
    article_title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    article_context: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },

    article_content: {
      type: Object,
      required: true,
    },

    slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    views: {
      type: Number,
      default: 0,
    },

    isPublished: {
      type: Boolean,
      default: true,
    },

    publishedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Article", articleSchema);