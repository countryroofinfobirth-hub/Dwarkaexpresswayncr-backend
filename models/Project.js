const mongoose = require("mongoose");
const slugify = require("slugify");

const projectSchema = new mongoose.Schema(
  {
    // BASIC
    name: { type: String, required: true },
    slug: { type: String, unique: true },
    location: String,
    price: String,
    landSize: String, // Land size (e.g., 5 acres, 2000 sq ft)

    // HERO
    hero: {
      heading: String,
      subText: String,
      image: String, // URL to hero image
      rera: String, // RERA Registration Number
      possession: String, // Possession date/status
    },

    // ABOUT
    about: {
      title: String,
      content: String,
      image: String, // URL to about image
    },

    // CONNECTIVITY
    connectivityMap: String, // URL to connectivity map image

    // GALLERY
    gallery: {
      type: [String], // Array of image URLs
      default: [],
    },

    // AMENITIES
    amenities: { type: [String], default: [] },

    // FAQ
    faqs: {
      type: [
        {
          question: String,
          answer: String,
        },
      ],
      default: [],
    },

    // SEO
    metaTitle: String,
    metaDescription: String,
    ogImage: String,
    schema: String,
  },
  { timestamps: true },
);

// AUTO SLUG
projectSchema.pre("save", function () {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
});

module.exports = mongoose.model("Project", projectSchema);
