import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.render('pages/index', {
        layout: 'layouts/base',
        title: 'RCHINAX Global | End-to-End Business Solutions',
    });
});

router.get('/login', (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/');
    res.render('pages/login', {
        layout: 'layouts/auth-layout',
        title: 'Sign In | RCHINAX Global',
    });
});

router.get('/signup', (req, res) => {
    if (req.session && req.session.userId) return res.redirect('/');
    res.render('pages/signup', {
        layout: 'layouts/auth-layout',
        title: 'Create Account | RCHINAX Global',
    });
});

router.get('/contact', (req, res) => {
    res.render('pages/contact', {
        layout: 'layouts/base',
        title: 'Contact Us | ROINAX GLOBAL',
        extraCss: '/css/contact.css'
    });
});

router.get('/services/logo-branding', (req, res) => {
    res.render('pages/logo-branding', {
        layout: 'layouts/base',
        title: 'Logo Design & Branding Solutions | ROINAX GLOBAL',
        extraCss: '/css/logo-branding.css'
    });
});

router.get('/services/web-ecommerce', (req, res) => {
    res.render('pages/web-ecommerce', {
        layout: 'layouts/base',
        title: 'Website Development & E-Commerce | ROINAX GLOBAL',
        extraCss: '/css/web-ecommerce.css'
    });
});

router.get('/services/domain-hosting', (req, res) => {
    res.render('pages/domain-hosting', {
        layout: 'layouts/base',
        title: 'Domain Registration & Hosting | ROINAX GLOBAL',
        extraCss: '/css/domain-hosting.css'
    });
});

router.get('/services/logistics-courier', (req, res) => {
    res.render('pages/logistics-courier', {
        layout: 'layouts/base',
        title: 'Global Logistics & Courier | ROINAX GLOBAL',
        extraCss: '/css/logistics-courier.css'
    });
});

router.get('/services/legal-compliance', (req, res) => {
    res.render('pages/legal-compliance', {
        layout: 'layouts/base',
        title: 'Legal & Compliance Documentation | ROINAX GLOBAL',
        extraCss: '/css/legal-compliance.css'
    });
});

router.get('/services/banking-insurance', (req, res) => {
    res.render('pages/banking-insurance', {
        layout: 'layouts/base',
        title: 'Business Banking & Insurance | ROINAX GLOBAL',
        extraCss: '/css/banking-insurance.css'
    });
});

router.get('/services/franchise-consulting', (req, res) => {
    res.render('pages/franchise-consulting', {
        layout: 'layouts/base',
        title: 'Franchise Strategy & Consulting | ROINAX GLOBAL',
        extraCss: '/css/franchise-consulting.css'
    });
});

router.get('/services/digital-marketing', (req, res) => {
    res.render('pages/digital-marketing', {
        layout: 'layouts/base',
        title: 'Digital Marketing & Growth | ROINAX GLOBAL',
        extraCss: '/css/digital-marketing.css'
    });
});

export default router;