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

export default router;