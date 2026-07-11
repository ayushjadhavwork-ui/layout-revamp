import { useEffect, useState } from "react";
import { X, ShoppingBag, Trash2, Plus, Check, ArrowUpRight } from "lucide-react";
import { toast } from "sonner";
import { CATALOG, CONFIG, fmt, type Category, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { validateCoupon, logCart, completeOrder } from "@/lib/gas";

/* ================================================================ */
/* PRODUCT GRID + CARD                       */
/* ================================================================ */

export function ProductGrid({
  category,
  items,
  onOpen,
  cols,
}: {
  category: Category;
  items: Product[];
  onOpen: (item: Product) => void;
  cols?: string;
}) {
  const cart = useStore((s) => s.cart);
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const templateLimit = useStore((s) => s.templateLimit());
  
  // Bring in the store actions so we can trigger them directly from the card
  const setSize = useStore((s) => s.setSize);
  const toggleTemplate = useStore((s) => s.toggleTemplate);
  const addItem = useStore((s) => s.addItem);
  const removeItem = useStore((s) => s.removeItem);

  return (
    <div className={`grid gap-4 ${cols ?? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"}`}>

      {items.map((item) => {
        // Check current states
        const cartItem = cart.find((c) => c.category === category && c.id === item.id);
        const inCart = !!cartItem;
        const isSize = category === "sizes";
        const isTemplate = category === "templates";
        
        const templateSelected = isTemplate && selectedTemplateIds.includes(item.id);
        const templateDisabled = isTemplate && (!selectedSizeId || (selectedTemplateIds.length >= templateLimit && !templateSelected));
        const sizeSelected = isSize && selectedSizeId === item.id;
        
        const active = templateSelected || sizeSelected || (inCart && !isTemplate && !isSize);

        // The new toggle logic directly on the card
        const handleToggle = () => {
          if (templateDisabled && !templateSelected) {
            if (!selectedSizeId) toast.error("Pick a page package first.");
            else toast.error(`You can only pick ${templateLimit} template(s) for this package.`);
            return;
          }

          if (isSize) {
            if (sizeSelected && cartItem) {
              removeItem(cartItem.key);
              toast.success(`${item.name} deselected`);
            } else {
              setSize(item.id);
              toast.success(`${item.name} selected`);
            }
          } else if (isTemplate) {
            toggleTemplate(item.id);
          } else {
            if (inCart && cartItem) {
              removeItem(cartItem.key);
              toast.success(`${item.name} removed`);
            } else {
              addItem(category, item, "");
              toast.success(`${item.name} added`);
            }
          }
        };

        return (
          <div
            key={item.id}
            onClick={handleToggle}
            className={`step-card group relative flex flex-col overflow-hidden transition cursor-pointer select-none ${
              active ? "ring-2 ring-rose-wine bg-rose-wine/5" : ""
            } ${templateDisabled ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-gradient-to-br from-pink-mist/60 to-blush-rose/40 font-display text-4xl text-rose-wine pointer-events-none">
              {item.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "✦"}
            </div>
            <h4 className="font-display text-xl text-rose-wine">{item.name}</h4>
            <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{item.desc}</p>
            <p className="mt-2 text-sm font-semibold text-blush-rose">
              {isTemplate ? "Included" : item.price ? fmt(item.price) : "Free"}
            </p>

            {/* Click stopPropagation prevents triggering handleToggle twice when clicking buttons */}
            <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={handleToggle}
                className={`pill-btn !py-2 !px-3 !text-xs flex-1 transition-all ${
                  active 
                    ? "!bg-rose-wine !text-white !border-rose-wine shadow-md" 
                    : "pill-btn-hover"
                }`}
                type="button"
              >
                {active ? (
                  <span className="flex items-center justify-center gap-1">
                    <Check className="h-3 w-3" /> Selected
                  </span>
                ) : (
                  "Select"
                )}
              </button>
              
              {/* Only show View More if the item has been selected */}
              {active && (
                <button
                  onClick={() => onOpen(item)}
                  className="pill-btn pill-btn-hover !py-2 !px-3 !text-xs animate-in fade-in zoom-in duration-200"
                  type="button"
                >
                  View More
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ================================================================ */
/*                         PRODUCT MODAL                            */
/* ================================================================ */

export function ProductModal({
  open,
  category,
  product,
  onClose,
}: {
  open: boolean;
  category: Category | null;
  product: Product | null;
  onClose: () => void;
}) {
  const [note, setNote] = useState("");
  const setSize = useStore((s) => s.setSize);
  const toggleTemplate = useStore((s) => s.toggleTemplate);
  const addItem = useStore((s) => s.addItem);
  const templateLimit = useStore((s) => s.templateLimit());
  const selectedSizeId = useStore((s) => s.selectedSizeId);

  useEffect(() => { if (open) setNote(""); }, [open, product?.id]);

  if (!open || !product || !category) return null;

  const isSize = category === "sizes";
  const isTemplate = category === "templates";

  const handleAdd = () => {
    if (isSize) {
      setSize(product.id);
      toast.success(`${product.name} selected — pick ${product.templateLimit} template(s).`);
    } else if (isTemplate) {
      if (!selectedSizeId) return toast.error("Pick a page package first.");
      const ok = toggleTemplate(product.id);
      if (!ok) return toast.error(`You can only pick ${templateLimit} template(s) for this package.`);
      toast.success(`${product.name} toggled.`);
    } else {
      addItem(category, product, note);
      toast.success(`${product.name} added to cart.`);
    }
    onClose();
  };

  return (
    <ModalShell onClose={onClose}>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex h-64 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-mist to-blush-rose font-display text-7xl text-white">
          {product.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 2) || "✦"}
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-blush-rose">{category}</p>
          <h3 className="font-display text-4xl text-rose-wine mt-2">{product.name}</h3>
          <p className="mt-3 text-neutral-700">{product.desc}</p>
          <p className="mt-4 text-2xl font-semibold text-blush-rose">
            {isTemplate ? "Included with package" : product.price ? fmt(product.price) : "Free"}
          </p>
          {!isSize && !isTemplate && (
            <>
              <label className="mt-5 block text-sm font-medium text-rose-wine">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 p-3 text-sm outline-none focus:border-rose-wine"
                maxLength={300}
                placeholder="Anything we should know?"
              />
            </>
          )}
          <button onClick={handleAdd} className="pill-btn pill-btn-hover pill-primary mt-5 w-full">
            {isSize ? "Select package" : isTemplate ? "Toggle selection" : "Add to cart"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ================================================================ */
/*                          CART DRAWER                             */
/* ================================================================ */

export function CartDrawer({
  open,
  onClose,
  onCheckout,
}: {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}) {
  const cart = useStore((s) => s.cart);
  const removeItem = useStore((s) => s.removeItem);
  const subtotal = useStore((s) => s.subtotal());
  const discount = useStore((s) => s.discount());
  const total = useStore((s) => s.total());
  const coupon = useStore((s) => s.coupon);
  const setCoupon = useStore((s) => s.setCoupon);

  const [promo, setPromo] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const applyPromo = async () => {
    if (!promo.trim()) return;
    setChecking(true);
    setMsg(null);
    try {
      const res = await validateCoupon(promo);
      if (res.valid && res.percent) {
        setCoupon({ code: promo.trim().toUpperCase(), percent: res.percent });
        setMsg(`Coupon applied — ${res.percent}% off`);
        toast.success(`${res.percent}% off applied`);
      } else {
        setCoupon(null);
        setMsg(res.message || "Invalid code");
      }
    } catch {
      setMsg("Could not validate — try again.");
    } finally {
      setChecking(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-rose-wine/25 backdrop-blur-sm" onClick={onClose} />
      <aside className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col p-4 animate-[slideInRight_.3s_ease-out]">
        <style>{`@keyframes slideInRight{from{transform:translateX(100%);}to{transform:translateX(0);}}`}</style>
        <div className="glass flex h-full flex-col rounded-3xl p-6">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-3xl text-rose-wine">Your cart</h3>
            <button onClick={onClose} className="rounded-full p-2 hover:bg-rose-wine/10" aria-label="Close">
              <X className="h-5 w-5 text-rose-wine" />
            </button>
          </div>

          <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
            {cart.length === 0 && <p className="text-center text-dusty-rose py-10">Your cart is empty.</p>}
            {cart.map((item) => (
              <div key={item.key} className="flex items-start gap-3 rounded-2xl bg-white/50 p-3">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-pink-mist to-blush-rose font-display text-white">
                  {item.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-rose-wine">{item.name}</p>
                  <p className="text-xs uppercase tracking-wider text-dusty-rose">{item.category}</p>
                  {item.note && <p className="mt-1 text-xs text-neutral-600 italic">"{item.note}"</p>}
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-blush-rose">{item.price ? fmt(item.price) : "—"}</p>
                  <button onClick={() => removeItem(item.key)} className="mt-1 text-neutral-400 hover:text-rose-wine">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-white/60 pt-4 text-sm">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmt(subtotal)}</span></div>
            <div className="flex gap-2">
              <input
                value={promo}
                onChange={(e) => setPromo(e.target.value)}
                placeholder="Promo code"
                className="flex-1 rounded-full border border-rose-wine/20 bg-white/60 px-4 py-2 text-sm outline-none focus:border-rose-wine"
              />
              <button onClick={applyPromo} disabled={checking} className="pill-btn pill-btn-hover">
                {checking ? "…" : "Apply"}
              </button>
            </div>
            {msg && <p className={`text-xs ${coupon ? "text-green-700" : "text-rose-wine"}`}>{msg}</p>}
            <div className="flex justify-between"><span>Discount</span><span>−{fmt(discount)}</span></div>
            <div className="flex justify-between border-t border-white/60 pt-2 text-lg font-semibold">
              <span>Total</span><span className="text-blush-rose">{fmt(total)}</span>
            </div>
          </div>

          <button
            onClick={onCheckout}
            disabled={cart.length === 0}
            className="pill-btn pill-btn-hover pill-primary mt-5 w-full disabled:opacity-50"
          >
            Checkout <ArrowUpRight className="h-4 w-4" />
          </button>
        </div>
      </aside>
    </>
  );
}

/* ================================================================ */
/*                       CUSTOMER INFO MODAL                        */
/* ================================================================ */

export function CustomerInfoModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const setCustomer = useStore((s) => s.setCustomer);
  const setCartId = useStore((s) => s.setCartId);
  const cart = useStore((s) => s.cart);
  const total = useStore((s) => s.total());
  const [submitting, setSubmitting] = useState(false);

  const handle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const info = {
      name: String(fd.get("name") || "").trim(),
      phone: String(fd.get("phone") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      address: String(fd.get("address") || "").trim(),
    };
    if (!info.name || !info.phone || !info.email || !info.address) return toast.error("Fill all fields");
    setSubmitting(true);
    setCustomer(info);
    try {
      const cartId = `TL-${Date.now().toString(36).toUpperCase()}`;
      setCartId(cartId);
      await logCart({ cartId, customer: info, cart, total, ts: new Date().toISOString() });
      onSubmit();
    } catch {
      toast.error("Could not save details — continuing anyway.");
      onSubmit();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <ModalShell onClose={onClose} maxW="max-w-lg">
      <h3 className="font-display text-3xl text-rose-wine">A few details first</h3>
      <p className="mt-1 text-sm text-dusty-rose">We need this to process and ship your order.</p>
      <form onSubmit={handle} className="mt-5 space-y-3">
        <Field label="Full name" name="name" required maxLength={100} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" name="phone" type="tel" required maxLength={20} />
          <Field label="Email" name="email" type="email" required maxLength={200} />
        </div>
        <Field label="Shipping address" name="address" as="textarea" rows={3} required maxLength={400} />
        <button disabled={submitting} className="pill-btn pill-btn-hover pill-primary w-full mt-2" type="submit">
          {submitting ? "Saving…" : "Continue to payment"}
        </button>
      </form>
    </ModalShell>
  );
}

/* ================================================================ */
/*                        PAYMENT MODAL                             */
/* ================================================================ */

export function PaymentModal({
  open,
  onClose,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  onDone: (orderId: string) => void;
}) {
  const total = useStore((s) => s.total());
  const cart = useStore((s) => s.cart);
  const customer = useStore((s) => s.customer);
  const cartId = useStore((s) => s.cartId);
  const coupon = useStore((s) => s.coupon);
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const upiLink = `upi://pay?pa=${encodeURIComponent(CONFIG.UPI_ID)}&pn=${encodeURIComponent(CONFIG.PAYEE)}&am=${total}&cu=INR&tn=${encodeURIComponent(cartId || "TheLayout")}`;
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(upiLink)}`;

  const submit = async () => {
    if (!file) return toast.error("Upload payment screenshot first.");
    setSubmitting(true);
    try {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((res, rej) => {
        reader.onload = () => res(String(reader.result));
        reader.onerror = rej;
        reader.readAsDataURL(file);
      });
      const orderId = cartId || `TL-${Date.now().toString(36).toUpperCase()}`;
      await completeOrder({
        orderId, cartId, customer, cart, total,
        coupon: coupon?.code || null,
        screenshotName: file.name,
        screenshot: dataUrl,
        ts: new Date().toISOString(),
      });
      onDone(orderId);
    } catch {
      toast.error("Order could not be submitted. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalShell onClose={onClose} maxW="max-w-lg">
      <h3 className="font-display text-3xl text-rose-wine">Complete payment</h3>
      <p className="mt-1 text-sm text-neutral-700">Scan the UPI QR, then upload your payment screenshot.</p>
      <div className="mt-5 flex flex-col items-center">
        <img src={qr} alt="UPI QR" className="h-56 w-56 rounded-2xl bg-white p-3 shadow-lg" />
        <p className="mt-3">Pay <span className="font-semibold text-blush-rose">{fmt(total)}</span> to <span className="font-medium">{CONFIG.UPI_ID}</span></p>
      </div>
      <label className="mt-5 block text-sm font-medium text-rose-wine">Payment screenshot</label>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        className="mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 p-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-rose-wine file:px-4 file:py-1.5 file:text-white"
      />
      <button onClick={submit} disabled={submitting || !file} className="pill-btn pill-btn-hover pill-primary w-full mt-5 disabled:opacity-50">
        {submitting ? "Submitting…" : "Complete order"}
      </button>
    </ModalShell>
  );
}

/* ================================================================ */
/*                        SUCCESS MODAL                             */
/* ================================================================ */

export function SuccessModal({ open, onClose, orderId }: { open: boolean; onClose: () => void; orderId: string | null }) {
  if (!open) return null;
  return (
    <ModalShell onClose={onClose} maxW="max-w-md">
      <div className="text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-blush-rose to-rose-wine text-white">
          <Check className="h-8 w-8" />
        </div>
        <h3 className="font-display text-4xl text-rose-wine mt-4">Thank you 🌸</h3>
        <p className="mt-2 text-neutral-700">Your order has been placed. We'll be in touch shortly.</p>
        {orderId && <p className="mt-2 text-xs text-dusty-rose">Order ID: {orderId}</p>}
        <button onClick={onClose} className="pill-btn pill-btn-hover pill-primary mt-5">Close</button>
      </div>
    </ModalShell>
  );
}

/* ================================================================ */
/*                            SHARED                                */
/* ================================================================ */

function ModalShell({ children, onClose, maxW = "max-w-2xl" }: { children: React.ReactNode; onClose: () => void; maxW?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-rose-wine/30 backdrop-blur-sm" onClick={onClose} />
      <div className={`glass relative z-10 w-full ${maxW} rounded-3xl p-6 md:p-8 max-h-[90vh] overflow-y-auto`}>
        <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-2 hover:bg-rose-wine/10" aria-label="Close">
          <X className="h-5 w-5 text-rose-wine" />
        </button>
        {children}
      </div>
    </div>
  );
}

function Field({
  label, name, type = "text", as = "input", rows, required, maxLength,
}: {
  label: string; name: string; type?: string; as?: "input" | "textarea"; rows?: number; required?: boolean; maxLength?: number;
}) {
  const cls = "mt-1 w-full rounded-xl border border-rose-wine/20 bg-white/60 px-4 py-2.5 text-sm outline-none focus:border-rose-wine transition-colors";
  return (
    <div>
      <label className="text-sm font-medium text-rose-wine">{label}</label>
      {as === "textarea" ? (
        <textarea name={name} rows={rows} required={required} maxLength={maxLength} className={cls} />
      ) : (
        <input name={name} type={type} required={required} maxLength={maxLength} className={cls} />
      )}
    </div>
  );
}

export function CartButton({ onOpen }: { onOpen: () => void }) {
  const count = useStore((s) => s.cart.length);
  return (
    <button onClick={onOpen} className="pill-btn pill-btn-hover relative">
      <ShoppingBag className="h-4 w-4" />
      <span className="hidden sm:inline">Cart</span>
      <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-wine px-1.5 text-xs font-semibold text-white">
        {count}
      </span>
    </button>
  );
}

export function StepIndicator() {
  const selectedSizeId = useStore((s) => s.selectedSizeId);
  const selectedTemplateIds = useStore((s) => s.selectedTemplateIds);
  const limit = useStore((s) => s.templateLimit());
  if (!selectedSizeId) return (
    <p className="text-center text-sm text-dusty-rose mb-6">
      <Plus className="inline h-4 w-4 -mt-0.5" /> Pick a page package below to unlock templates.
    </p>
  );
  return (
    <p className="text-center text-sm text-rose-wine mb-6">
      <Check className="inline h-4 w-4 -mt-0.5" /> Package selected — templates chosen {selectedTemplateIds.length}/{limit}
    </p>
  );
}
