import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const CurrencyConverter = () => {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const currencies = ['USD', 'EUR', 'MYR', 'SGD', 'AUD', 'CAD', 'GBP', 'JPY', 'CNY', 'INR', 'THB', 'PHP', 'IDR', 'VND', 'NZD'];

    const fetchCurrencyConverter = async (amount) => {
        const response = await fetch(
            `https://api.currencyapi.com/v3/latest?apikey=cur_live_FAU5nwZsDHfD8bHjHNAaVOwji0UmirWXx5qfLjQY`
        );
        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error('Error fetching data.');
        }
    };

    const formatCurrencyData = (amount, convertData) => {
        const baseRate = 1 / convertData.data[fromCurrency].value;
        const rate = convertData.data[toCurrency].value;
        const exchangeRate = baseRate * rate * amount;
        return ` ${fromCurrency} ${amount} is equal to ${toCurrency} ${exchangeRate.toFixed(2)} `;
    };

    const handleConvert = async () => {
        const amountValue = parseFloat(amount);
        if (!isNaN(amountValue) && amountValue > 0) {
            setLoading(true);
            try {
                const convertData = await fetchCurrencyConverter(amountValue);
                const formattedResult = formatCurrencyData(amountValue, convertData);
                setResult(formattedResult);
            } catch (error) {
                setResult('Error converting currency. Please try again.');
                console.error('Error:', error);
            }
            setLoading(false);
        } else if (amountValue <= 0) {
            setResult('Please enter an amount greater than 0.');
        } else {
            setResult('Please enter a valid amount.');
        }
    };

    const handleReset = () => {
        setAmount('');
        setResult('');
    };

    return (
        <Container className="my-4">
            <Row className="justify-content-center">
                <Col xs={12} sm={10} md={8}>
                    <div className="currency-converter p-3 p-md-4 border rounded shadow" style={{
                        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                        color: 'white'
                    }}>
                        <h3 className="text-center mb-3 mb-md-4">Currency Converter</h3>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="form-control-lg"
                                />
                            </Form.Group>

                            <Row className="g-3">
                                <Col xs={12} sm={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>From Currency</Form.Label>
                                        <Form.Select
                                            value={fromCurrency}
                                            onChange={(e) => setFromCurrency(e.target.value)}
                                            className="form-select-lg"
                                        >
                                            {currencies.map((currency) => (
                                                <option key={currency} value={currency}>
                                                    {currency}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col xs={12} sm={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>To Currency</Form.Label>
                                        <Form.Select
                                            value={toCurrency}
                                            onChange={(e) => setToCurrency(e.target.value)}
                                            className="form-select-lg"
                                        >
                                            {currencies.map((currency) => (
                                                <option key={currency} value={currency}>
                                                    {currency}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>

                            <div className="d-flex flex-column flex-sm-row justify-content-between gap-2 mt-4">
                                <Button
                                    variant="primary"
                                    onClick={handleConvert}
                                    disabled={loading}
                                    className="w-100 w-sm-auto"
                                >
                                    {loading ? 'Converting...' : 'Convert'}
                                </Button>
                                <Button
                                    variant="secondary"
                                    onClick={handleReset}
                                    className="w-100 w-sm-auto"
                                >
                                    Reset
                                </Button>
                            </div>

                            {result && (
                                <div className="mt-3 p-2 p-md-3">
                                    <h5 className="text-center" style={{ color: 'white' }}>{result}</h5>
                                </div>
                            )}
                        </Form>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default CurrencyConverter; 