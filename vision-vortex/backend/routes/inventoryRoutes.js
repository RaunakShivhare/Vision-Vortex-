// Medicine inventory (stock) management

const express = require("express");
const pool = require("../config/db");
const { requireLogin } = require("../middleware/authMiddleware");
const { MAX_INT, validateNumber } = require("../lib/validation");

const router = express.Router();
router.use(requireLogin);

function validateInventoryFields({ itemName, quantity, reorderLevel }) {
  if (typeof itemName !== "string" || !itemName.trim()) return "Item name is required";
  if (itemName.trim().length > 150) return "Item name must be 150 characters or fewer";
  return validateNumber(quantity, "Quantity", { required: true, integer: true, max: MAX_INT })
    || validateNumber(reorderLevel, "Reorder level", { required: true, integer: true, max: MAX_INT });
}

router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM inventory WHERE owner_id = ? ORDER BY item_name ASC", [req.session.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch inventory" });
  }
});

router.post("/", async (req, res) => {
  try {
    const { itemName, quantity, unit, reorderLevel } = req.body;
    const fields = {
      ...req.body,
      quantity: quantity === undefined || quantity === null ? 0 : quantity,
      reorderLevel: reorderLevel === undefined || reorderLevel === null ? 5 : reorderLevel,
    };
    const validationError = validateInventoryFields(fields);
    if (validationError) return res.status(400).json({ success: false, message: validationError });

    const [result] = await pool.query(
      "INSERT INTO inventory (owner_id, item_name, quantity, unit, reorder_level) VALUES (?, ?, ?, ?, ?)",
      [req.session.user.id, itemName.trim(), fields.quantity, unit || "units", fields.reorderLevel]
    );
    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not add item" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { itemName, quantity, unit, reorderLevel } = req.body;
    const validationError = validateInventoryFields(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const [existing] = await pool.query("SELECT id FROM inventory WHERE id = ? AND owner_id = ?", [req.params.id, req.session.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Item not found" });

    await pool.query(
      "UPDATE inventory SET item_name=?, quantity=?, unit=?, reorder_level=? WHERE id=?",
      [itemName.trim(), quantity, unit, reorderLevel, req.params.id]
    );
    res.json({ success: true, message: "Inventory item updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not update item" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT id FROM inventory WHERE id = ? AND owner_id = ?", [req.params.id, req.session.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Item not found" });

    await pool.query("DELETE FROM inventory WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Item deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete item" });
  }
});

module.exports = router;
