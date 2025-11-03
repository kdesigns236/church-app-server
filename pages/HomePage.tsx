import React from 'react';
import { Link } from 'react-router-dom';
import { PrayerRequestForm } from '../components/PrayerRequestForm';
import { SermonsIcon, EventsIcon, BibleIcon, GivingIcon } from '../constants/icons';
import { useAppContext } from '../context/AppContext';

const QuickAccessCard: React.FC<{ icon: React.ElementType; title: string; description: string; to: string; }> = ({ icon: Icon, title, description, to }) => (
    <Link to={to} className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 p-6 flex flex-col items-center text-center animate-slide-in-up">
        <div className="bg-secondary p-4 rounded-full mb-4">
            <Icon className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-serif font-bold text-primary dark:text-white mb-2">{title}</h3>
        <p className="text-text-main dark:text-gray-300 flex-grow">{description}</p>
        <span className="mt-4 text-secondary font-semibold hover:underline">Learn More &rarr;</span>
    </Link>
);


const HomePage: React.FC = () => {
    const { siteContent, announcements } = useAppContext();
    const verseOfTheWeek = siteContent?.verseOfTheWeek || { text: '', citation: '' };

    return (
        <div className="animate-fade-in">
            {/* Hero Section - Reduced size for mobile */}
            <section className="relative text-white py-12 md:py-24 bg-gradient-divine dark:bg-gradient-divine-dark">
                <div className="absolute inset-0 bg-primary opacity-30"></div>
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
                    <h1 className="text-3xl md:text-5xl font-serif font-bold text-white drop-shadow-lg animate-fade-in">Church of God Evening Light</h1>
                    <p className="mt-3 text-base md:text-xl font-light scripture-text text-gold-light animate-fade-in" style={{ animationDelay: '0.2s' }}>
                        "For where two or three are gathered in my name, there am I among them." - Matthew 18:20
                    </p>
                    <Link
                        to="/events"
                        className="mt-6 inline-block bg-secondary text-primary font-bold py-2 px-6 rounded-full text-base hover:bg-gold-light transition-all duration-300 transform hover:scale-105 shadow-lg animate-fade-in"
                        style={{ animationDelay: '0.4s' }}
                    >
                        Join Our Community
                    </Link>
                </div>
            </section>
            
            {/* Welcome Message */}
            <section className="py-16 bg-accent dark:bg-gray-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center gap-8 md:gap-12">
                    <div className="md:w-1/3 text-center md:text-left animate-slide-in-up">
                        <img src="/logo.jpg" alt="Church logo" className="w-48 h-48 object-contain mx-auto md:mx-0" />
                    </div>
                    <div className="md:w-2/3 animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                        <h2 className="text-3xl font-serif font-bold text-primary dark:text-white mb-4">A Warm Welcome to You</h2>
                        <p className="text-text-main dark:text-gray-300 mb-4">
                            Welcome to the Church of God Evening Light, a place of faith, hope, and community. We are delighted to have you with us. Our church is a family, united in our love for Christ and our mission to spread His light in the world. Whether you are a longtime member or a first-time visitor, we pray you feel at home and blessed by your time with us.
                        </p>
                        <p className="font-semibold text-primary dark:text-secondary">- BISHOP SAMSON SITATI</p>
                    </div>
                </div>
            </section>

            {/* Quick Access Cards */}
            <section className="py-16 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-serif text-center font-bold text-primary dark:text-white mb-10">Explore Our Ministry</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        <QuickAccessCard icon={SermonsIcon} title="Sermons" description="Listen to and watch inspiring messages from our pastors." to="/sermons" />
                        <QuickAccessCard icon={EventsIcon} title="Events" description="Find out about upcoming events, services, and community gatherings." to="/events" />
                        <QuickAccessCard icon={BibleIcon} title="Bible" description="Engage with the Word of God through our study tools and reading plans." to="/bible" />
                        <QuickAccessCard icon={GivingIcon} title="Giving" description="Support our ministry and mission through tithes and offerings." to="/giving" />
                    </div>
                </div>
            </section>
            
             {/* Live Service & Updates */}
            <section className="py-16 bg-accent dark:bg-gray-900">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
                    <div className="animate-slide-in-up">
                        <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">Live Service</h3>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                            <p className="text-text-main dark:text-gray-300 mb-4">Our Sunday service is not currently live. Please join us this Sunday at 10:00 AM.</p>
                            <button className="w-full bg-gray-400 text-white font-bold py-3 px-6 rounded-lg cursor-not-allowed">
                                Service Offline
                            </button>
                        </div>
                    </div>
                     <div className="animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                        <h3 className="text-2xl font-serif font-bold text-primary dark:text-white mb-4">Latest Updates</h3>
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md space-y-4">
                            {announcements.length > 0 ? (
                                announcements.slice(0, 2).map((announcement, index) => (
                                    <div key={announcement.id} className={index > 0 ? "border-t border-gray-200 dark:border-gray-700 pt-4" : ""}>
                                        <h4 className="font-bold text-primary dark:text-secondary">{announcement.title}</h4>
                                        <p className="text-sm text-text-main dark:text-gray-300">{announcement.content}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{announcement.date}</p>
                                    </div>
                                ))
                            ) : (
                                <div>
                                    <h4 className="font-bold text-primary dark:text-secondary">No Updates Yet</h4>
                                    <p className="text-sm text-text-main dark:text-gray-300">Check back soon for the latest church announcements!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            {/* Prayer Request & Weekly Verse */}
            <section className="py-16 bg-gray-50 dark:bg-gray-800">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-start">
                    <div className="animate-slide-in-up">
                        <h2 className="text-3xl font-serif text-center md:text-left font-bold text-primary dark:text-white mb-6">Need Prayer?</h2>
                        <p className="text-text-main dark:text-gray-300 mb-6 text-center md:text-left">
                            We believe in the power of prayer. If you have a need, we would be honored to pray for you. All requests are handled with care and confidentiality.
                        </p>
                        <PrayerRequestForm />
                    </div>
                    <div className="bg-primary text-white p-8 rounded-lg shadow-lg animate-slide-in-up" style={{animationDelay: '0.2s'}}>
                        <h3 className="text-2xl font-serif font-bold text-secondary mb-4">Verse of the Week</h3>
                        <blockquote className="border-l-4 border-secondary pl-4">
                            <p className="text-xl italic scripture-text">
                               "{verseOfTheWeek.text}"
                            </p>
                            <cite className="block mt-4 not-italic font-semibold">{verseOfTheWeek.citation}</cite>
                        </blockquote>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HomePage;