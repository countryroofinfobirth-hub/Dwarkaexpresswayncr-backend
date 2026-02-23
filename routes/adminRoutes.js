const express = require("express");
const router = express.Router();
const Project = require("../models/Project");
const adminAuth = require("../middleware/adminAuth");

router.get("/login", (req, res) => {
  try {
    const error = req.query.expired ? "Session expired. Please login again." : null;
    res.render("admin/login", { error });
  } catch (err) {
    console.error("Error rendering login:", err.message);
    res.status(500).send("Error: " + err.message);
  }
});

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;
    const clientIp = req.ip;

    // Input validation
    if (!username || !password) {
      return res.render("admin/login", { error: "Username and password required" });
    }

    // Check rate limit
    if (!req.app.checkLoginLimit(clientIp)) {
      console.log(`[LOGIN_RATE_LIMITED] IP: ${clientIp}`);
      return res.status(429).render("admin/login", {
        error: "Too many login attempts. Please try again in 15 minutes."
      });
    }

    // Check credentials from environment
    const adminUsername = process.env.ADMIN_USERNAME || "admin";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin";

    console.log(`[LOGIN_ATTEMPT] IP: ${clientIp} | Username: ${username}`);

    // Simple comparison (update later with bcrypt hash)
    if (username === adminUsername && password === adminPassword) {
      req.session.isAdmin = true;
      req.session.userId = "admin_" + Date.now();
      req.session.loginTime = Date.now();
      req.session.username = username;
      
      console.log(`[LOGIN_SUCCESS] IP: ${clientIp} | Username: ${username}`);
      return res.redirect("/admin");
    }

    console.log(`[LOGIN_FAILED] IP: ${clientIp} | Invalid credentials`);
    res.render("admin/login", { error: "Invalid username or password" });
  } catch (err) {
    console.error("Login error:", err);
    res.render("admin/login", { error: "An error occurred during login" });
  }
});

router.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error("Session destroy error:", err);
    res.redirect("/admin/login");
  });
});

router.get("/", adminAuth, async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.render("admin/dashboard", { projects });
  } catch (err) {
    console.error("Error fetching projects for dashboard:", err);
    res.status(500).send("Error: " + err.message);
  }
});

router.get("/add-project", adminAuth, (req, res) => {
  res.render("admin/add-project");
});

router.post("/add-project", adminAuth, async (req, res) => {
  try {
    console.log("\n=== ADD PROJECT REQUEST ===");
    console.log("Content-Type:", req.headers['content-type']);
    console.log("Body keys:", Object.keys(req.body || {}));
    
    const d = req.body || {};

    // Validate required fields
    if (!d.name || !d.location) {
      console.error("Missing required fields - name or location");
      return res.status(400).render("admin/add-project", {
        error: "Project name and location are required.",
        formData: req.body
      });
    }

    console.log("Project name:", d.name);
    console.log("Project location:", d.location);

    // Handle FAQs
    let faqs = [];
    const faqQuestions = d.faqQuestion || [];
    const faqAnswers = d.faqAnswer || [];
    
    const questions = Array.isArray(faqQuestions) ? faqQuestions : (faqQuestions ? [faqQuestions] : []);
    const answers = Array.isArray(faqAnswers) ? faqAnswers : (faqAnswers ? [faqAnswers] : []);
    
    for (let i = 0; i < questions.length; i++) {
      if (questions[i] && String(questions[i]).trim()) {
        faqs.push({ 
          question: questions[i].trim(), 
          answer: (answers[i] || "").trim()
        });
      }
    }

    console.log("FAQs count:", faqs.length);

    // Handle amenities
    let amenities = [];
    const amenitiesInput = d.amenities || [];
    const amenitiesArray = Array.isArray(amenitiesInput) ? amenitiesInput : (amenitiesInput ? [amenitiesInput] : []);
    amenities = amenitiesArray.filter(a => a && String(a).trim()).map(a => String(a).trim());

    console.log("Amenities count:", amenities.length);

    // Handle gallery (with alt tags)
    let gallery = [];
    const galleryUrlInput = d.galleryUrl || [];
    const galleryAltInput = d.galleryAlt || [];
    const galleryUrls = Array.isArray(galleryUrlInput) ? galleryUrlInput : (galleryUrlInput ? [galleryUrlInput] : []);
    const galleryAlts = Array.isArray(galleryAltInput) ? galleryAltInput : (galleryAltInput ? [galleryAltInput] : []);
    for (let i = 0; i < galleryUrls.length; i++) {
      if (galleryUrls[i] && String(galleryUrls[i]).trim()) {
        gallery.push({
          url: String(galleryUrls[i]).trim(),
          alt: galleryAlts[i] ? String(galleryAlts[i]).trim() : ''
        });
      }
    }
    console.log("Gallery images count:", gallery.length);

    const projectData = {
      name: d.name.trim(),
      location: d.location.trim(),
      price: (d.price || "").trim(),
      landSize: (d.landSize || "").trim(),

      hero: {
        heading: (d.heroHeading || "").trim(),
        subText: (d.heroSubText || "").trim(),
        image: (d.heroImage || "").trim(),
        imageAlt: (d.heroImageAlt || "").trim(),
        rera: (d.heroRera || "").trim(),
        possession: (d.heroPossession || "").trim(),
      },

      about: {
        title: (d.aboutTitle || "").trim(),
        content: (d.aboutContent || "").trim(),
        image: (d.aboutImage || "").trim(),
        imageAlt: (d.aboutImageAlt || "").trim(),
      },

      amenities,
      gallery,
      faqs,

      connectivityMap: (d.connectivityMap || "").trim(),
      connectivityMapAlt: (d.connectivityMapAlt || "").trim(),

      metaTitle: (d.metaTitle || "").trim(),
      metaDescription: (d.metaDescription || "").trim(),
      ogImage: (d.ogImage || "").trim(),
      schema: (d.schema || "").trim(),
    };

    console.log("Creating project with data:", {
      name: projectData.name,
      location: projectData.location,
      faqs: faqs.length,
      amenities: amenities.length,
      gallery: gallery.length
    });

    console.log("Validation passed. Preparing to save project...");
    console.log("Project data:", projectData); // Log the project data before saving

    try {
      const result = await Project.create(projectData);
      console.log("✅ Project created successfully:", result);
      res.redirect("/admin");
    } catch (dbError) {
      console.error("❌ Database save error:", dbError.message);
      console.error(dbError);
      let userMessage = "Failed to save project. Please try again.";
      if (dbError && dbError.code === 11000) {
        // Duplicate key (e.g., unique slug conflict)
        userMessage = "A project with the same name/slug already exists.";
      }
      res.status(500).render("admin/add-project", {
        error: userMessage,
        formData: req.body
      });
    }
  } catch (err) {
    console.error("❌ ADD PROJECT ERROR:", err.message);
    console.error(err);
    res.status(500).send("Error: " + err.message);
  }
});

// Test endpoint to verify DB connectivity and insertion (protected)
router.get('/test-create', adminAuth, async (req, res) => {
  try {
    const testProj = await Project.create({ name: 'Test Project ' + Date.now(), location: 'Test Location' });
    console.log('Test project created:', testProj._id);
    res.json({ ok: true, project: testProj });
  } catch (err) {
    console.error('TEST CREATE ERROR:', err);
    res.status(500).json({ ok: false, message: err.message, code: err.code });
  }
});

router.get('/test-db', adminAuth, async (req, res) => {
  try {
    const count = await Project.countDocuments();
    res.json({ ok: true, count });
  } catch (err) {
    console.error('TEST DB ERROR:', err);
    res.status(500).json({ ok: false, message: err.message });
  }
});
router.get("/delete/:id", adminAuth, async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.redirect("/admin");
  } catch (err) {
    console.error("Error deleting project:", err);
    res.status(500).send("Error: " + err.message);
  }
});

router.get("/edit/:id", adminAuth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).lean();
    if (!project) {
      return res.status(404).send("Project not found");
    }
    res.render("admin/edit-project", { project });
  } catch (err) {
    console.error("Error fetching project for edit:", err);
    res.status(500).send("Error: " + err.message);
  }
});

router.post("/edit/:id", adminAuth, async (req, res) => {
  try {
    console.log("\n=== EDIT PROJECT REQUEST ===");
    console.log("Project ID:", req.params.id);
    
    const d = req.body || {};

    // Validate required fields
    if (!d.name || !d.location) {
      console.error("Missing required fields - name or location");
      return res.status(400).render("admin/edit-project", {
        error: "Project name and location are required.",
        project: Object.assign({}, d, { _id: req.params.id })
      });
    }

    console.log("Project name:", d.name);
    console.log("Project location:", d.location);

    // Handle FAQs
    let faqs = [];
    const faqQuestions = d.faqQuestion || [];
    const faqAnswers = d.faqAnswer || [];
    
    const questions = Array.isArray(faqQuestions) ? faqQuestions : (faqQuestions ? [faqQuestions] : []);
    const answers = Array.isArray(faqAnswers) ? faqAnswers : (faqAnswers ? [faqAnswers] : []);
    
    for (let i = 0; i < questions.length; i++) {
      if (questions[i] && String(questions[i]).trim()) {
        faqs.push({ 
          question: questions[i].trim(), 
          answer: (answers[i] || "").trim()
        });
      }
    }

    console.log("FAQs count:", faqs.length);

    // Handle amenities
    let amenities = [];
    const amenitiesInput = d.amenities || [];
    const amenitiesArray = Array.isArray(amenitiesInput) ? amenitiesInput : (amenitiesInput ? [amenitiesInput] : []);
    amenities = amenitiesArray.filter(a => a && String(a).trim()).map(a => String(a).trim());

    console.log("Amenities count:", amenities.length);

    // Handle gallery (with alt tags)
    let gallery = [];
    const galleryUrlInput = d.galleryUrl || [];
    const galleryAltInput = d.galleryAlt || [];
    const galleryUrls = Array.isArray(galleryUrlInput) ? galleryUrlInput : (galleryUrlInput ? [galleryUrlInput] : []);
    const galleryAlts = Array.isArray(galleryAltInput) ? galleryAltInput : (galleryAltInput ? [galleryAltInput] : []);
    for (let i = 0; i < galleryUrls.length; i++) {
      if (galleryUrls[i] && String(galleryUrls[i]).trim()) {
        gallery.push({
          url: String(galleryUrls[i]).trim(),
          alt: galleryAlts[i] ? String(galleryAlts[i]).trim() : ''
        });
      }
    }
    console.log("Gallery images count:", gallery.length);

    const updateData = {
      name: d.name.trim(),
      location: d.location.trim(),
      price: (d.price || "").trim(),
      landSize: (d.landSize || "").trim(),

      hero: {
        heading: (d.heroHeading || "").trim(),
        subText: (d.heroSubText || "").trim(),
        image: (d.heroImage || "").trim(),
        imageAlt: (d.heroImageAlt || "").trim(),
        rera: (d.heroRera || "").trim(),
        possession: (d.heroPossession || "").trim(),
      },

      about: {
        title: (d.aboutTitle || "").trim(),
        content: (d.aboutContent || "").trim(),
        image: (d.aboutImage || "").trim(),
        imageAlt: (d.aboutImageAlt || "").trim(),
      },

      amenities,
      gallery,
      faqs,

      connectivityMap: (d.connectivityMap || "").trim(),
      connectivityMapAlt: (d.connectivityMapAlt || "").trim(),

      metaTitle: (d.metaTitle || "").trim(),
      metaDescription: (d.metaDescription || "").trim(),
      ogImage: (d.ogImage || "").trim(),
      schema: (d.schema || "").trim(),
    };

    console.log("Updating project with data:", {
      name: updateData.name,
      location: updateData.location,
      faqs: faqs.length,
      amenities: amenities.length,
      gallery: gallery.length
    });

    const result = await Project.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!result) {
      return res.status(404).send("Project not found");
    }
    
    console.log("✅ Project updated with ID:", result._id);
    res.redirect("/admin");
  } catch (err) {
    console.error("❌ EDIT PROJECT ERROR:", err.message);
    console.error(err);
    res.status(500).render("admin/edit-project", {
      error: "Failed to update project. Please try again.",
      project: Object.assign({}, req.body, { _id: req.params.id })
    });
  }
});

module.exports = router;
