import { useState, useCallback, useEffect } from "react";
import { type ZodSchema } from "zod";

type Errors = Record<string, string>;

export function useFormValidation<T>(schema: ZodSchema<T>) {
  const [errors, setErrors] = useState<Errors>({});

  const validate = useCallback(
    (data: unknown): data is T => {
      const result = schema.safeParse(data);
      if (result.success) {
        setErrors({});
        return true;
      }
      const newErrors: Errors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join(".");
        if (!newErrors[path]) {
          newErrors[path] = issue.message;
        }
      }
      setErrors(newErrors);
      return false;
    },
    [schema]
  );

  const clearErrors = useCallback(() => setErrors({}), []);

  const clearField = useCallback((field: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }, []);

  return { errors, validate, clearErrors, clearField };
}

export function FieldError({ error }: { error?: string }) {
  if (!error) return null;
  return <p className="mt-1 text-xs font-semibold text-red-500">{error}</p>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushSubscription() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function checkPushStatus() {
      const supported = "serviceWorker" in navigator && "PushManager" in window;
      if (!supported) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setIsSupported(true);

      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (!cancelled) {
          setIsSubscribed(!!sub);
          setLoading(false);
        }
      } catch {
        if (!cancelled) setLoading(false);
      }
    }

    checkPushStatus();
    return () => { cancelled = true; };
  }, []);

  const subscribe = useCallback(async () => {
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!
        ) as BufferSource,
      });
      const json = sub.toJSON();
      const keys = json.keys as { p256dh: string; auth: string };

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: keys.p256dh,
          auth: keys.auth,
        }),
      });

      setIsSubscribed(true);
    } catch {
      // user denied or error
    } finally {
      setSubscribing(false);
    }
  }, []);

  const unsubscribe = useCallback(async () => {
    setSubscribing(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch("/api/push/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } finally {
      setSubscribing(false);
    }
  }, []);

  return { isSupported, isSubscribed, loading, subscribing, subscribe, unsubscribe };
}
