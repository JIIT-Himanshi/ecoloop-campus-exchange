const validateListing = (req, res, next) => {
  const { title, description, category, type, condition, location } = req.body;
  if (!title || !description || !category || !type || !condition || !location) {
    return res.status(400).json({ message: "Please complete all required listing fields." });
  }

  if (type === "For Sale" && (!Number.isFinite(Number(req.body.price)) || Number(req.body.price) <= 0)) {
    return res.status(400).json({ message: "A valid price is required for sale listings." });
  }
  if (type === "Exchange" && !String(req.body.exchangeFor || "").trim()) {
    return res.status(400).json({ message: "Please specify what you want in exchange." });
  }
  next();
};

module.exports = validateListing;
