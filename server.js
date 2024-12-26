
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v2: cloudinary } = require('cloudinary');
const fileUpload = require('express-fileupload');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/' }));


// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI || 'mongodb+srv://pradipkumarchaudhary06:qmhKDogTMAGkg2su@cluster2.mak47.mongodb.net/foodproject', {  
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Cloudinary configuration
cloudinary.config({
  cloud_name: 'dhaumphvl',
  api_key: '223977999232774',
  api_secret: 'A386eCIQlD5V_XxCERgSzUGwdb4', // Replace with actual API secret
});

// MongoDB schema and model
const FormSchema = new mongoose.Schema({
  description: String,
  imageUrl: String,
  category: String, // New field for category
});

const FormModel = mongoose.model('Form', FormSchema);

// Routes
// POST: Upload form data
app.post('/api/upload', async (req, res) => {
  try {
    const { description, category } = req.body; // Include category from request body

    if (!req.files || !req.files.image) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    const file = req.files.image;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'uploads',
    });

    // Save data to MongoDB
    const newEntry = new FormModel({
      description,
      imageUrl: uploadResponse.secure_url,
      category, // Save category in the database
    });
    await newEntry.save();

    res.status(200).json({ message: 'Form submitted successfully!' });
  } catch (error) {
    console.error('Error during upload:', error);
    res.status(500).json({ message: 'Error submitting form', error });
  }
});

// GET: Fetch all forms
app.get('/api/forms', async (req, res) => {
  try {
    const forms = await FormModel.find(); // Fetch all forms from the database
    res.status(200).json(forms); // Send back the list of forms as JSON
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching forms' });
  }
});


app.delete('/api/form/:id', async (req, res) => {
  try {
    const formId = req.params.id;
    const deletedForm = await FormModel.findByIdAndDelete(formId);
    if (!deletedForm) {
      return res.status(404).send({ message: 'Form not found' });
    }
    res.status(200).send({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ message: 'Error deleting form', error });
  }
});



// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
