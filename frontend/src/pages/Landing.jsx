import Header from "@/components/vsl/Header";
import Hero from "@/components/vsl/Hero";
import Stats from "@/components/vsl/Stats";
import Testimonials from "@/components/vsl/Testimonials";
import FAQ from "@/components/vsl/FAQ";
import Footer from "@/components/vsl/Footer";

export default function Landing({ gateData = null }) {
    return (
        <main
            data-testid="vsl-landing-page"
            className="min-h-screen bg-[#050A08] text-white"
        >
            <Header />
            <Hero gateData={gateData} />
            <Stats />
            <Testimonials />
            <FAQ />
            <Footer />
        </main>
    );
}
