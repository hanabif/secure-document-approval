'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const Navbar = () => {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem('token');
        router.push('/login');
    };

    if (pathname === '/login' || pathname === '/register') {
        return null;
    }

    return (
        <nav className="bg-gray-800 p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-white text-lg font-bold">
                    DocuFlow
                </Link>
                <div className="flex items-center space-x-4">
                    <Link href="/dashboard" className="text-gray-300 hover:text-white">
                        Dashboard
                    </Link>
                    <Link href="/documents/upload" className="text-gray-300 hover:text-white">
                        Upload
                    </Link>
                    <button
                        onClick={handleLogout}
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;