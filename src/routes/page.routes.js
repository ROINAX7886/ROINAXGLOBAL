import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, redirectIfAuth } from '../middleware/auth.middleware.js';

const router = Router();
const prisma = new PrismaClient();

// Public Views
router.get('/', (req, res) => {
    res.render('pages/index', {
        layout: 'layouts/base',
        title: 'ROINAX Global | End-to-End Business Solutions',
    });
});

router.get('/login', redirectIfAuth, (req, res) => {
    res.render('pages/login', {
        layout: 'layouts/auth-layout',
        title: 'Sign In | ROINAX Global',
    });
});

router.get('/signup', redirectIfAuth, (req, res) => {
    res.render('pages/signup', {
        layout: 'layouts/auth-layout',
        title: 'Create Account | ROINAX Global',
    });
});

router.get('/contact', (req, res) => {
    res.render('pages/contact', {
        layout: 'layouts/base',
        title: 'Contact Us | ROINAX GLOBAL',
        extraCss: '/css/contact.css'
    });
});

// Services Verticals
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

// Marketplace / Procurement
router.get('/buy-now', (req, res) => {
    res.render('pages/buy-now', {
        layout: 'layouts/base',
        title: 'Procure Enterprise Packages | ROINAX GLOBAL',
        extraCss: '/css/buy-now.css'
    });
});

// Authenticated User Profile
router.get('/profile', requireAuth, async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.session.userId },
            select: { id: true, name: true, email: true, createdAt: true }
        });

        if (!user) {
            req.session.destroy();
            return res.redirect('/login');
        }

        res.render('pages/profile', {
            layout: 'layouts/base',
            title: 'User Profile | ROINAX GLOBAL',
            extraCss: '/css/profile.css',
            user
        });
    } catch (err) {
        console.error('Profile route error:', err);
        res.redirect('/');
    }
});

export default router;