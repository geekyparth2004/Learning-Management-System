import re

with open('components/landing/HeroLanding.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace handleGetStarted
old_handle = '''  const handleGetStarted = () => {
    if (status === "loading") return;
    if (session) {
      handleCheckout();
    } else {
      setShowRegister(true);
    }
  };'''

new_handle = '''  const [registerWithPayment, setRegisterWithPayment] = useState(false);

  const handleGetStarted = (withPayment: boolean) => {
    if (status === "loading") return;
    if (session) {
      if (withPayment) {
        handleCheckout();
      } else {
        window.location.href = "/dashboard";
      }
    } else {
      setRegisterWithPayment(withPayment);
      setShowRegister(true);
    }
  };'''

content = content.replace(old_handle, new_handle)

# Replace RegisterModal usage
old_modal = '''<RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} onSuccess={() => {
        setShowRegister(false);
        handleCheckout();
      }} />'''

new_modal = '''<RegisterModal isOpen={showRegister} onClose={() => setShowRegister(false)} withPayment={registerWithPayment} onSuccess={() => {
        setShowRegister(false);
        if (registerWithPayment) {
          handleCheckout();
        } else {
          window.location.href = "/dashboard";
        }
      }} />'''
content = content.replace(old_modal, new_modal)

# Replace onClick bindings
# Nav
content = content.replace(
    'onClick={handleGetStarted}\n            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-orange-600',
    'onClick={() => handleGetStarted(false)}\n            className="hidden sm:inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-500 to-orange-600'
)
# Hero
content = content.replace(
    'onClick={handleGetStarted}\n              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600',
    'onClick={() => handleGetStarted(false)}\n              className="group relative inline-flex items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-red-600'
)

# Props pass to PricingSection and CTASection
content = content.replace(
    '<PricingSection onGetStarted={handleGetStarted} />',
    '<PricingSection onGetStarted={() => handleGetStarted(true)} />'
)
content = content.replace(
    '<CTASection onGetStarted={handleGetStarted} />',
    '<CTASection onGetStarted={() => handleGetStarted(true)} />'
)

with open('components/landing/HeroLanding.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Updates applied.")
