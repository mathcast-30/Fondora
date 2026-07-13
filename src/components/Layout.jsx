import Sidebar from './Sidebar'
import Footer from './Footer'

function Layout({ children }) {
    return (
        <div className="flex bg-graylight min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 flex flex-col justify-between">
                <div>
                    {children}
                </div>
                <Footer />
            </main>
        </div>
    )
}

export default Layout