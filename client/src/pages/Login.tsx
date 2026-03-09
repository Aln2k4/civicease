import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Building2, Terminal } from "lucide-react";

export default function Login() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        identifier: "", // Changed from email to identifier
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            // Using context login to ensure global state update
            await login(formData.identifier, formData.password);
            navigate("/dashboard");
        } catch (err: any) {
            setError(err.response?.data?.message || "Invalid credentials");
        } finally {
            setIsLoading(false);
        }
    };

    const isAdminMode = formData.identifier.toLowerCase() === 'admin';

    return (
        <div className={`flex h-screen w-full flex-col items-center justify-center px-4 transition-colors duration-500 ${isAdminMode ? 'bg-[#0a0a0a] font-mono' : 'bg-background'}`}>
            <div className={`mb-8 flex flex-col items-center text-center space-y-2 transition-transform duration-500 ${isAdminMode ? 'scale-110' : ''}`}>
                <div className={`p-3 rounded-full shadow-sm mb-2 transition-colors duration-500 ${isAdminMode ? 'bg-[#1a1a1a] border border-green-500/30' : 'bg-white'}`}>
                    {isAdminMode ? <Terminal className="h-8 w-8 text-green-500" /> : <Building2 className="h-8 w-8 text-primary" />}
                </div>
                <h1 className={`text-3xl font-bold uppercase tracking-wider transition-colors duration-500 ${isAdminMode ? 'text-green-500' : 'text-primary'}`}>
                    {isAdminMode ? 'SYS_ADMIN' : 'CivicEase'}
                </h1>
                <p className={`text-sm font-medium uppercase tracking-widest transition-colors duration-500 ${isAdminMode ? 'text-green-600/70' : 'text-muted-foreground'}`}>
                    {isAdminMode ? 'Root Access Terminal' : 'A Government Service Portal'}
                </p>
            </div>
            <Card className={`w-full max-w-sm shadow-lg transition-all duration-500 ${isAdminMode ? 'bg-black/80 border-green-500/50 shadow-green-500/20 text-green-500 rounded-none border-2' : 'bg-white border-border/50'}`}>
                <CardHeader className="space-y-1">
                    <CardTitle className={`text-2xl font-bold text-center transition-colors duration-500 ${isAdminMode ? 'text-green-500' : 'text-primary'}`}>
                        {isAdminMode ? '> AUTHENTICATE_' : 'Login'}
                    </CardTitle>
                    <CardDescription className={`text-center transition-colors duration-500 ${isAdminMode ? 'text-green-600/70' : ''}`}>
                        {isAdminMode ? 'Enter credentials to access master node.' : 'Enter your Username or Email to access your account.'}
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="grid gap-4">
                        {error && (
                            <div className="text-sm font-medium text-destructive text-center bg-destructive/10 p-2 rounded-md">{error}</div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="identifier" className={isAdminMode ? 'text-green-600' : 'text-muted-foreground'}>
                                {isAdminMode ? 'root@identifier:~$' : 'Username or Email'}
                            </Label>
                            <Input
                                id="identifier"
                                type="text"
                                placeholder={isAdminMode ? '_' : 'KL01KARLM01'}
                                value={formData.identifier}
                                onChange={handleChange}
                                required
                                className={`transition-all duration-500 ${isAdminMode ? 'bg-black border-green-500/50 text-green-500 focus-visible:ring-green-500 placeholder:text-green-800/50 rounded-none font-mono selection:bg-green-500/30' : 'bg-background/50 border-input focus-visible:ring-primary'}`}
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className={isAdminMode ? 'text-green-600' : 'text-muted-foreground'}>
                                    {isAdminMode ? 'root@password:~$' : 'Password'}
                                </Label>
                                {!isAdminMode && (
                                    <Link to="#" className="text-sm font-medium text-secondary hover:text-primary hover:underline">
                                        Forgot password?
                                    </Link>
                                )}
                            </div>
                            <Input
                                id="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className={`transition-all duration-500 ${isAdminMode ? 'bg-black border-green-500/50 text-green-500 focus-visible:ring-green-500 placeholder:text-green-800/50 rounded-none font-mono selection:bg-green-500/30' : 'bg-background/50 border-input focus-visible:ring-primary'}`}
                            />
                        </div>
                        <Button className={`w-full transition-all duration-500 shadow-sm ${isAdminMode ? 'bg-green-600 hover:bg-green-500 text-black font-bold uppercase tracking-widest rounded-none border border-green-500' : 'bg-primary hover:bg-primary/90 text-white'}`} type="submit" disabled={isLoading}>
                            {isLoading ? (isAdminMode ? "INITIATING..." : "Signing in...") : (isAdminMode ? "[ EXECUTE ]" : "Sign In")}
                        </Button>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <div className={`text-center text-sm ${isAdminMode ? 'text-green-600/70' : 'text-muted-foreground'}`}>
                            {isAdminMode ? 'RESTRICTED SYSTEM' : 'Official Government Portal'}
                        </div>
                    </CardFooter>
                </form>
            </Card>
            <div className={`mt-8 text-center text-xs transition-colors duration-500 ${isAdminMode ? 'text-green-600/50' : 'text-muted-foreground/60'}`}>
                <p>&copy; 2026 CivicEase {isAdminMode ? 'CORE FRAMEWORK.' : 'Government Portal.'} All rights reserved.</p>
                <p>{isAdminMode ? 'Connection Encrypted 256-bit' : 'Secure Access • Privacy Protected'}</p>
            </div>
        </div>
    );
}
