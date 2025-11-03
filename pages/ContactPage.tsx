import React from 'react';
import { MailIcon, PhoneIcon, LocationMarkerIcon } from '../constants/icons';
import { useAppContext } from '../context/AppContext';

const InfoItem: React.FC<{ icon: React.ElementType; title: string; lines: string[]; isLink?: boolean; href?: string; }> = ({ icon: Icon, title, lines, isLink, href }) => (
    <div className="flex items-start gap-4">
        <div className="bg-secondary p-3 rounded-full flex-shrink-0">
            <Icon className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h3 className="text-lg font-semibold text-primary dark:text-secondary">{title}</h3>
            {lines.map((line, i) => {
                const link = isLink ? (href === 'mailto:' ? `${href}${line}` : `tel:${line}`) : '#';
                 return isLink ? (
                    <a key={i} href={link} className="block text-text-main dark:text-gray-300 hover:underline">{line}</a>
                ) : (
                    <p key={i} className="text-text-main dark:text-gray-300">{line}</p>
                )
            })}
        </div>
    </div>
);

const ContactPage: React.FC = () => {
    const { siteContent } = useAppContext();
    const contactInfo = siteContent?.contactInfo || { addressLine1: '', addressLine2: '', email: '', phone1: '', phone2: '' };

    return (
        <div className="bg-gray-50 dark:bg-gray-900/50 flex-grow animate-fade-in">
            <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                     <MailIcon className="w-16 h-16 text-primary dark:text-secondary mx-auto mb-4" />
                    <h1 className="text-4xl font-serif font-bold text-primary dark:text-white">Contact Us</h1>
                    <p className="mt-2 text-lg text-text-main dark:text-gray-300">
                        We'd love to hear from you. Reach out with any questions or prayer needs.
                    </p>
                </div>
                
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
                    {/* Contact Info */}
                    <div className="space-y-8 animate-slide-in-up">
                         <h2 className="text-3xl font-serif font-bold text-primary dark:text-white mb-6">Get in Touch</h2>
                         <InfoItem icon={LocationMarkerIcon} title="Our Location" lines={[contactInfo.addressLine1, contactInfo.addressLine2]} />
                         <InfoItem icon={MailIcon} title="Email Us" lines={[contactInfo.email]} isLink href="mailto:" />
                         <InfoItem icon={PhoneIcon} title="Call Us" lines={[contactInfo.phone1, contactInfo.phone2]} isLink href="tel:" />
                    </div>

                    {/* Map */}
                    <div className="animate-slide-in-up" style={{ animationDelay: '0.2s' }}>
                         <h2 className="text-3xl font-serif font-bold text-primary dark:text-white mb-6">Find Us Here</h2>
                         <div className="rounded-lg shadow-lg overflow-hidden h-96 bg-gray-200 dark:bg-gray-800">
                            <iframe 
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d63836.21633519179!2d34.95462879574883!3d1.025996029367295!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1781d66a6a2a0e23%3A0x6b14643354516751!2sKitale!5e0!3m2!1sen!2ske!4v1698345123456"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                allowFullScreen={false}
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Church Location Map"
                            ></iframe>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ContactPage;
