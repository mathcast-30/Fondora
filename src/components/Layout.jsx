import Sidebar from './Sidebar'

function Layout({ children }) {
    return (
        <div className="flex bg-graylight min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {children}
            </main>
        </div>
    )
}

export default Layout