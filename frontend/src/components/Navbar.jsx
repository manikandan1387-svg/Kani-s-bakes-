import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, User, LogOut, Package, LayoutDashboard, Menu as MenuIcon, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

const linkBase = "px-3 py-2 rounded-full text-sm font-medium transition-colors duration-200";

export default function Navbar() {
  const { count, setOpen } = useCart();
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 kwb-glass border-b border-cocoa/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3 flex items-center gap-4">
        <Link to="/" data-testid="brand-logo" className="flex items-center gap-2 group">
          <div className="w-9 h-9 rounded-2xl bg-cocoa text-cream flex items-center justify-center font-serif text-lg">K</div>
          <div className="leading-none">
            <div className="font-serif text-lg font-semibold text-cocoa">Kani's</div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-cocoa/70">Whisk & Bakes</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1 ml-8">
          <NavLinks />
        </nav>
        {/* mobile nav rendered further below */}

        <div className="ml-auto flex items-center gap-2">
          <button
            data-testid="open-cart-btn"
            aria-label="Open cart"
            onClick={() => setOpen(true)}
            className="relative w-11 h-11 rounded-full bg-cocoa text-cream hover:bg-cocoa-700 transition-colors duration-200 flex items-center justify-center"
          >
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span data-testid="cart-count-badge" className="absolute -top-1 -right-1 bg-peach text-cocoa text-[11px] font-semibold rounded-full min-w-5 h-5 px-1 flex items-center justify-center border-2 border-cream">
                {count}
              </span>
            )}
          </button>

          {user && user.role ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="user-menu-btn" aria-label="User menu" className="w-11 h-11 rounded-full bg-cream border border-cocoa/15 hover:bg-cream-200 flex items-center justify-center text-cocoa transition-colors duration-200">
                  <User className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border border-cocoa/10">
                <DropdownMenuLabel className="text-cocoa">
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-cocoa/60">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {user.role === "admin" ? (
                  <DropdownMenuItem data-testid="menu-admin" onClick={() => nav("/admin")}><LayoutDashboard className="w-4 h-4 mr-2" />Admin dashboard</DropdownMenuItem>
                ) : (
                  <DropdownMenuItem data-testid="menu-orders" onClick={() => nav("/orders")}><Package className="w-4 h-4 mr-2" />My orders</DropdownMenuItem>
                )}
                <DropdownMenuItem data-testid="menu-logout" onClick={async () => { await logout(); nav("/"); }} className="text-destructive"><LogOut className="w-4 h-4 mr-2" />Logout</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/login" data-testid="nav-login" className="hidden sm:inline-flex px-4 py-2 rounded-full text-sm font-medium text-cocoa border border-cocoa/20 hover:bg-cocoa hover:text-cream transition-colors duration-200">
              Sign in
            </Link>
          )}

          <button
            data-testid="mobile-menu-toggle"
            aria-label="Toggle menu"
            className="md:hidden w-11 h-11 rounded-full border border-cocoa/15 flex items-center justify-center text-cocoa"
            onClick={() => setMobileOpen((o) => !o)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-cocoa/10 bg-cream px-4 py-3 flex flex-col gap-1">
          <NavLinks onClick={() => setMobileOpen(false)} />
          {!user && <Link to="/login" data-testid="mobile-login" onClick={() => setMobileOpen(false)} className={`${linkBase} text-cocoa hover:bg-cocoa/10`}>Sign in</Link>}
        </div>
      )}
    </header>
  );
}

function NavLinks({ onClick }) {
  return (
    <>
      <NavLink to="/" end onClick={onClick} data-testid="nav-home" className={({ isActive }) =>
        `${linkBase} ${isActive ? "bg-cocoa text-cream" : "text-cocoa hover:bg-cocoa/10"}`
      }>Home</NavLink>
      <NavLink to="/menu" onClick={onClick} data-testid="nav-menu" className={({ isActive }) =>
        `${linkBase} ${isActive ? "bg-cocoa text-cream" : "text-cocoa hover:bg-cocoa/10"}`
      }>Menu</NavLink>
      <NavLink to="/track" onClick={onClick} data-testid="nav-track" className={({ isActive }) =>
        `${linkBase} ${isActive ? "bg-cocoa text-cream" : "text-cocoa hover:bg-cocoa/10"}`
      }>Track Order</NavLink>
    </>
  );
}
