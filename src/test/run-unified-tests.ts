import PaymentValidation from './validate-payment';

async function runUnifiedTests() {
  console.log('\n--- Running Unified Payment Tests ---\n');

  const paymentValidation = new PaymentValidation();

  try {
    // Test 1: Valid Payment
    await paymentValidation.processValidPayment();

    // Test 2: Invalid Payment
    await paymentValidation.processInvalidPayment();

    // Test 3: Valid Webhook
    await paymentValidation.validateWebhook();

    // Test 4: Invalid Webhook
    await paymentValidation.validateInvalidWebhook();

    console.log('\n--- All Payment Tests Completed Successfully ---');
  } catch (error: any) {
    console.error('\nError during Unified Payment Tests:', error.message);
  }
}

runUnifiedTests();
