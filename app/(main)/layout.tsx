import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import InstallPrompt from '@/components/InstallPrompt'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar — only visible on desktop */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {/* Main content */}
      {/* On mobile: no left margin, extra bottom padding for mobile nav */}
      {/* On desktop: left margin equal to sidebar width */}
      <main className="flex-1 md:ml-56  overflow-x-hidden  min-h-screen
                       pb-20 md:pb-0">
        {children}
      </main>


      {/* Bottom nav — only visible on mobile */}
      <div className="block md:hidden">
        <MobileNav />
      </div>
      {/* 
        InstallPrompt shows a banner at the bottom of the screen
        when the app is not yet installed on the device.
        It only shows on supported browsers like Chrome and Edge.
      */}

      <InstallPrompt />
    </div>
  )
}







