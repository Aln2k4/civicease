const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

connectDB();

// Start Worker
require('./src/workers/index');

const app = require('./src/app');

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
