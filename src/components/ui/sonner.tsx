import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      expand={false}
      visibleToasts={1}
      closeButton
      richColors
      duration={3000}
      gap={12}
      offset={24}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "toast-professional group relative flex items-start gap-3 w-full max-w-lg mx-auto pl-4 pr-4 py-4 rounded-lg border transition-all duration-300 ease-out shadow-lg hover:shadow-xl",
          title: "toast-title text-sm font-semibold leading-tight font-sans",
          description: "toast-description text-sm leading-relaxed mt-1 font-sans",
          actionButton: "toast-action inline-flex items-center justify-center rounded-md text-xs font-medium transition-all px-3 py-1.5 ml-auto",
          cancelButton: "toast-cancel inline-flex items-center justify-center rounded-md text-xs font-medium transition-all px-3 py-1.5",
          icon: "toast-icon-professional flex-shrink-0 w-5 h-5 mt-0.5",
          content: "toast-content flex-1 min-w-0 pr-2",
          error: "toast-error",
          success: "toast-success",
          warning: "toast-warning",
          info: "toast-info",
          loading: "toast-loading",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
