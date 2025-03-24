document.addEventListener('DOMContentLoaded', () => {
    // Pricing Modal
    const pricingTrigger = document.getElementById('pricing-trigger');
    const pricingModal = document.getElementById('pricing-modal');
    const pricingClose = document.getElementById('pricing-close');

    function openPricingModal() {
        pricingModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closePricingModal() {
        pricingModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    if (pricingTrigger && pricingModal && pricingClose) {
        pricingTrigger.addEventListener('click', (e) => {
            e.preventDefault();
            openPricingModal();
        });

        pricingClose.addEventListener('click', closePricingModal);

        pricingModal.addEventListener('click', (e) => {
            if (e.target === pricingModal) {
                closePricingModal();
            }
        });

        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && pricingModal.classList.contains('active')) {
                closePricingModal();
            }
        });
    }
}); 