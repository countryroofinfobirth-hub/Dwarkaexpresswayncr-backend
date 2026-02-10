const Project = require("../models/Project");

exports.addProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getAllProjects = async (req, res) => {
  res.json(await Project.find().sort({ createdAt: -1 }));
};

exports.getProjectBySlug = async (req, res) => {
  const project = await Project.findOne({ slug: req.params.slug });
  if (!project) return res.status(404).json({ message: "Not found" });
  res.json(project);
};
