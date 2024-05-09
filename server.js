const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const compression = require('compression');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const Budget = require('./models/myBudget.schema');
const crypto = require('crypto');

const app = express();
const port = 3000;

app.use(cookieParser());
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(compression());

// Connect to MongoDB
//mongoose.connect('mongodb+srv://doadmin:07JndKlv94851ab3@mybudget-ad997177.mongo.ondigitalocean.com/myBudget?tls=true&authSource=admin&replicaSet=mybudget',{

mongoose.connect('mongodb+srv://doadmin:6G9wtBR085Yg31P7@mybudget-ad997177.mongo.ondigitalocean.com/admin?tls=true&authSource=admin&replicaSet=mybudget',{
  useNewUrlParser: true,
  
  useUnifiedTopology: true
})
.then(() => {
  console.log('Connected to MongoDB');
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
})
.catch(err => {
  console.error('Error connecting to MongoDB:', err);
});

// Schema for user
const UserSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model('User', UserSchema);

// Generate a random secret key
const secretKey = crypto.randomBytes(32).toString('hex');

// Function to generate JWT token with 1 minute expiration
function generateAuthToken(user) {
  return jwt.sign({ userId: user.id, userEmail: user.email }, secretKey, { expiresIn: '1m' });
}

// Signup route
app.post('/myBudget/users', async (req, res) => {
  try {
      const { email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) {
          return res.status(400).json({ error: 'User already exists' });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();
      
      res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
      console.error('Error signing up:', err);
      res.status(500).json({ error: 'Internal server error' });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
      const user = await User.findOne({ email });
      if (!user) {
          return res.status(401).json({ error: 'Invalid email or password' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
          return res.status(401).json({ error: 'Invalid email or password' });
      }

      const token = generateAuthToken(user);

      // Set the JWT token as a cookie
      res.cookie('token', token, { httpOnly: true, secure: true, sameSite: 'None' });
      res.json({ message: 'Login successful', token });
  } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ error: 'Internal server error' });
  }
});


// Serve the dashboard HTML file
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});




// Middleware to verify JWT token
function verifyToken(req, res, next) {
  const token = req.cookies.token;
  if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
          return res.status(401).json({ error: 'Unauthorized' });
      }
      req.user = decoded;
      next();
  });
}

// Protected route example
app.get('/protected-route', verifyToken, (req, res) => {
  res.json({ message: 'Access granted to protected route', user: req.user });
});

// Logout route
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ message: 'User signed out successfully' });
});

// Refresh token route
app.post('/refresh-token', verifyToken, (req, res) => {
  // Generate a new JWT token with 1 minute expiration
  const newToken = generateAuthToken(req.user);

  // Set the new token as a cookie
  res.cookie('token', newToken, { httpOnly: true, secure: true, sameSite: 'None' });

  // Respond with the new token
  res.json({ message: 'Token refreshed successfully', token: newToken });
});

// Fetch data from MongoDB and send it as JSON
app.get('/budget', async (req, res) => {
  try {
    const data = await Budget.find();
    res.json(data);
  } catch (err) {
    console.error('Error fetching data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add new data to MongoDB
app.post('/budget', async (req, res) => {
  try {
    const { title, related_value, color } = req.body;
    const newData = new Budget({ title, related_value, color });
    await newData.save();
    res.status(201).json(newData);
  } catch (err) {
    console.error('Error adding data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update existing data in MongoDB by title
app.put('/budget/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const { related_value, color } = req.body;
    
    // Find and update the document by title
    const updatedData = await Budget.findOneAndUpdate({ title }, { related_value, color }, { new: true });
    
    // Check if the document was found and updated
    if (!updatedData) {
      return res.status(404).json({ error: 'Data not found' });
    }

    // Send the updated document as the response
    res.json(updatedData);
  } catch (err) {
    console.error('Error updating data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete existing data from MongoDB
app.delete('/budget/:title', async (req, res) => {
  try {
    const { title } = req.params;
    const deletedData = await Budget.findOneAndDelete({ title });
    if (!deletedData) {
      return res.status(404).json({ error: 'Item not found' });
    }
    res.json({ message: 'Item deleted successfully', deletedData });
  } catch (err) {
    console.error('Error deleting data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a new route to create a new database
app.post('/new-budget', async (req, res) => {
  try {
    // Drop the existing database
    await mongoose.connection.dropDatabase();

    // Optionally, you can create any initial data here

    res.status(200).json({ message: 'New budget created successfully' });
  } catch (err) {
    console.error('Error creating new budget:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



















