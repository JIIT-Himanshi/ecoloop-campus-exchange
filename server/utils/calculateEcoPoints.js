// EcoPoints are awarded only after BOTH participants confirm completion.
// This function returns the points for one completed transaction.
const calculateEcoPoints = (type) => {
  const points = {
    Donation: 20,
    Exchange: 15,
    "For Sale": 10,
  };

  return points[type] || 10;
};

module.exports = calculateEcoPoints;
