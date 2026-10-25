const express = require("express");
const pool = require("../config/db");
const { requireLogin } = require("../middleware/authMiddleware");
const { validateDate } = require("../lib/validation");

const router = express.Router();
router.use(requireLogin);

function validateVaccinationFields({ animalId, vaccineName, dateGiven, nextDueDate }, requireAnimal = true) {
  if (requireAnimal && (!animalId || !Number.isInteger(Number(animalId)) || Number(animalId) < 1)) return "Please select a valid animal";
  if (typeof vaccineName !== "string" || !vaccineName.trim()) return "Vaccine name is required";
  if (vaccineName.trim().length > 150) return "Vaccine name must be 150 characters or fewer";
  return validateDate(dateGiven, "Date given", { required: true })
    || validateDate(nextDueDate, "Next due date", { required: true })
    || (dateGiven && nextDueDate && nextDueDate < dateGiven ? "Next due date cannot be before the date given" : null);
}

// GET all vaccinations for the logged-in user
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT v.*, a.name AS animal_name, a.animal_tag
       FROM vaccinations v JOIN animals a ON v.animal_id = a.id
       WHERE v.owner_id = ? ORDER BY v.next_due_date ASC`,
      [req.session.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch vaccination records" });
  }
});

// CREATE
router.post("/", async (req, res) => {
  try {
    const { animalId, vaccineName, dateGiven, nextDueDate, givenBy } = req.body;
    const validationError = validateVaccinationFields(req.body);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const [result] = await pool.query(
      "INSERT INTO vaccinations (animal_id, owner_id, vaccine_name, date_given, next_due_date, given_by) VALUES (?, ?, ?, ?, ?, ?)",
      [animalId, req.session.user.id, vaccineName, dateGiven, nextDueDate, givenBy || null]
    );
    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not add vaccination record" });
  }
});

// UPDATE
router.put("/:id", async (req, res) => {
  try {
    const { vaccineName, dateGiven, nextDueDate, givenBy } = req.body;
    const validationError = validateVaccinationFields(req.body, false);
    if (validationError) return res.status(400).json({ success: false, message: validationError });
    const [existing] = await pool.query("SELECT id FROM vaccinations WHERE id = ? AND owner_id = ?", [req.params.id, req.session.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Record not found" });

    await pool.query(
      "UPDATE vaccinations SET vaccine_name=?, date_given=?, next_due_date=?, given_by=? WHERE id=?",
      [vaccineName, dateGiven, nextDueDate, givenBy, req.params.id]
    );
    res.json({ success: true, message: "Vaccination record updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not update record" });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const [existing] = await pool.query("SELECT id FROM vaccinations WHERE id = ? AND owner_id = ?", [req.params.id, req.session.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: "Record not found" });

    await pool.query("DELETE FROM vaccinations WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: "Vaccination record deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete record" });
  }
});

module.exports = router;
