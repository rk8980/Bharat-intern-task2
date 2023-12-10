const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const Transaction = require('./models/Transaction');
const currencyFormatter = require('currency-formatter');
const methodOverride = require('method-override');
const app = express();
const PORT = 3000;

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(methodOverride('_method'));

// Update the MongoDB connection string with your actual connection string
mongoose.connect('mongodb://localhost:27017/expense-tracker');

app.get('/', async (req, res) => {
  try {
    const transactions = await Transaction.find();
    const totalIncome = transactions
      .filter(transaction => transaction.type === 'income')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const totalExpense = transactions
      .filter(transaction => transaction.type === 'expense')
      .reduce((sum, transaction) => sum + transaction.amount, 0);

    const remainingMoney = totalIncome - totalExpense;

    // Format currency to Indian Rupees
    const formattedTransactions = transactions.map(transaction => ({
      ...transaction._doc,
      amount: currencyFormatter.format(transaction.amount, { code: 'INR' }),
    }));

    res.render('index', {
      transactions: formattedTransactions,
      totalIncome: currencyFormatter.format(totalIncome, { code: 'INR' }),
      totalExpense: currencyFormatter.format(totalExpense, { code: 'INR' }),
      remainingMoney: currencyFormatter.format(remainingMoney, { code: 'INR' }),
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/add', (req, res) => {
  res.render('addTransaction');
});

app.post('/add', async (req, res) => {
  const { description, amount, type } = req.body;

  try {
    await Transaction.create({ description, amount, type });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});

// ... (existing routes)

app.delete('/delete/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).send('Transaction not found');
    }

    await Transaction.findByIdAndDelete(id);
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal Server Error');
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
