const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white border-t border-gray-800 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="md:flex md:justify-between">
                    <div className="mb-6 md:mb-0">
                        <span className="text-xl font-bold tracking-tight text-white">Livestock Manager</span>
                        <p className="mt-2 text-sm text-gray-400">Premium quality livestock for your needs.</p>
                    </div>
                    <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">
                        <div>
                            <h2 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Resources</h2>
                            <ul className="text-gray-400">
                                <li className="mb-2"><a href="#" className="hover:underline">Documentation</a></li>
                                <li><a href="#" className="hover:underline">Support</a></li>
                            </ul>
                        </div>
                        <div>
                            <h2 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wider">Legal</h2>
                            <ul className="text-gray-400">
                                <li className="mb-2"><a href="#" className="hover:underline">Privacy Policy</a></li>
                                <li><a href="#" className="hover:underline">Terms &amp; Conditions</a></li>
                            </ul>
                        </div>
                    </div>
                </div>
                <hr className="my-6 border-gray-800 sm:mx-auto lg:my-8" />
                <div className="sm:flex sm:items-center sm:justify-between">
                    <span className="text-sm text-gray-400 sm:text-center">© {new Date().getFullYear()} Livestock Manager™. All Rights Reserved.
                    </span>
                </div>
            </div>
        </footer>
    )
}

export default Footer

