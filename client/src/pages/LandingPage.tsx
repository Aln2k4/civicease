import { Link } from "react-router-dom";
import { ArrowRight, Users, FileText, ShieldCheck, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Header */}
            <header className="bg-surface shadow-sm sticky top-0 z-10">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Activity className="h-6 w-6 text-primary" />
                        <span className="text-xl font-bold text-text-main">CivicEase</span>
                    </div>
                    <Link to="/login" className="btn btn-primary">
                        Sign In
                    </Link>
                </div>
            </header>

            {/* Hero Section */}
            <main className="flex-1">
                <section className="py-20 bg-gradient-to-b from-surface to-background">
                    <div className="container mx-auto px-4 text-center">
                        <h1 className="text-5xl font-bold mb-6 text-text-main">
                            Streamlining <span className="text-primary">Civic Management</span>
                        </h1>
                        <p className="text-xl text-muted mb-8 max-w-2xl mx-auto leading-relaxed">
                            A comprehensive platform for managing citizen records, family registries,
                            and municipal services with efficiency and transparency.
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link to="/login" className="btn btn-primary px-8 py-3 text-lg flex items-center gap-2">
                                Get Started <ArrowRight className="h-5 w-5" />
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-20">
                    <div className="container mx-auto px-4">
                        <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
                        <div className="grid md:grid-cols-3 gap-8">
                            <Card className="bg-surface border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader>
                                    <Users className="h-10 w-10 text-primary mb-4" />
                                    <CardTitle>Citizen Registry</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted">
                                        Maintain detailed records of all citizens, including demographics,
                                        family connections, and residential history.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-surface border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader>
                                    <FileText className="h-10 w-10 text-primary mb-4" />
                                    <CardTitle>Service Management</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted">
                                        Efficiently process requests for certificates, permits, and other
                                        essential municipal services.
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="bg-surface border-none shadow-lg hover:shadow-xl transition-shadow duration-300">
                                <CardHeader>
                                    <ShieldCheck className="h-10 w-10 text-primary mb-4" />
                                    <CardTitle>Secure & Private</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted">
                                        Built with robust security measures to ensure sensitive citizen data
                                        remains protected and confidential.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="bg-surface border-t py-8 mt-auto">
                <div className="container mx-auto px-4 text-center text-muted">
                    <p>&copy; {new Date().getFullYear()} CivicEase. All rights reserved.</p>
                </div>
            </footer>
        </div>
    );
}
