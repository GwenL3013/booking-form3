import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';

const CurrencyConverter = () => {
    const [amount, setAmount] = useState('');
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('EUR');
    const [result, setResult] = useState('');
    const [loading, setLoading] = useState(false);

    const currencies = ['USD', 'EUR', 'MYR', 'SGD', 'AUD'];

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
        <Container className="my-5">
            <Row className="justify-content-center">
                <Col md={8}>
                    <div className="currency-converter p-4 border rounded shadow" style={{
                        background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
                        color: 'white'
                    }}>
                        <h3 className="text-center mb-4">Currency Converter</h3>
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Amount</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="Enter amount"
                                />
                            </Form.Group>

                            <Row>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>From Currency</Form.Label>
                                        <Form.Select
                                            value={fromCurrency}
                                            onChange={(e) => setFromCurrency(e.target.value)}
                                        >
                                            {currencies.map((currency) => (
                                                <option key={currency} value={currency}>
                                                    {currency}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col>
                                    <Form.Group className="mb-3">
                                        <Form.Label>To Currency</Form.Label>
                                        <Form.Select
                                            value={toCurrency}
                                            onChange={(e) => setToCurrency(e.target.value)}
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

                            <div className="d-flex justify-content-between">
                                <Button variant="primary" onClick={handleConvert} disabled={loading}>
                                    {loading ? 'Converting...' : 'Convert'}
                                </Button>
                                <Button variant="secondary" onClick={handleReset}>
                                    Reset
                                </Button>
                            </div>

                            {result && (
                                <div className="mt-3 p-3">
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