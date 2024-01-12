// app.js
import express from 'express';
import bloodSearchRequestRoutes from './Routes/bloodSearchRoute.js';
import { checkBloodRequestsProximity } from './Services/geolocationService.js';
import { fileURLToPath } from 'url';
import path from 'path';
import bodyParser from 'body-parser';
import cors from 'cors';


const app = express();
const PORT = process.env.PORT || 8082;
const __filename = fileURLToPath(import.meta.url);
// Get the directory name
const __dirname = path.dirname(__filename);

app.use(bodyParser.json());
app.use(cors());

app.use('/api', bloodSearchRequestRoutes);

// setInterval(async () => {
//   const bloodBankCoordinates = [40.123, 32.456];
//   await checkBloodRequestsProximity(bloodBankCoordinates);
// }, 10000);

app.listen(PORT, () => {
  console.log(`Staff Service is listening at http://localhost:${PORT}`);
});