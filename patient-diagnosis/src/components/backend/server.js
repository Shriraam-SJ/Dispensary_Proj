import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Route imports
import authRoutes from './routes/authroutes.js';       
import patientRoutes from './routes/patientRoutes.js';
import diagnosisRoutes from './routes/diagnosisRoutes.js';
import billRoutes from './routes/billRoutes.js';
import medicineRoutes from './routes/medicines.js';
import patientSummaryRoutes from './routes/patientSummaryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import auth from './routes/authroutes.js';
const app = express();
const PORT = 5000;

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like curl or Postman)
    if (!origin) return callback(null, true);

    // Allow any origin that matches localhost with any port
    if (/^http:\/\/localhost:\d+$/.test(origin)) {
      return callback(null, true);
    }

    // Otherwise block
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true ,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // if you use cookies or auth headers
}));
app.use(bodyParser.json());

// Routes
app.use('/api', authRoutes);              // Handles /api/login, /api/register, etc.
app.use('/api/patients', patientRoutes);
app.use('/api/diagnosis', diagnosisRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/patient', patientSummaryRoutes);
app.use('/api/register',auth)

app.use('/api/report', reportRoutes);


// Root test
app.get('/', (req, res) => {
  res.send('🚀 Dispensary backend is running!');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
