const express = require("express");
const router = express.Router();
const Project = require("../models/Project");

// ALL PROJECTS (JSON)
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find();
    res.json(projects);
  } catch (err) {
    console.error("Error fetching all projects:", err);
    res.status(500).json({ error: err.message });
  }
});

// ALL PROJECTS (HTML VIEW)
router.get("/view", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.render("projects-list", { projects });
  } catch (err) {
    console.error("Error rendering projects list:", err);
    res.status(500).send("Error: " + err.message);
  }
});

// SINGLE PROJECT BY SLUG (JSON)
router.get("/:slug", async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    res.json(project);
  } catch (err) {
    console.error("Error fetching project by slug:", err);
    res.status(500).json({ error: err.message });
  }
});

// SINGLE PROJECT BY SLUG (HTML VIEW)
router.get("/view/:slug", async (req, res) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project) {
      return res.status(404).send("Project not found");
    }

    res.render("project-detail", { project });
  } catch (err) {
    console.error("Error rendering project detail:", err);
    res.status(500).send("Error: " + err.message);
  }
});

module.exports = router;
