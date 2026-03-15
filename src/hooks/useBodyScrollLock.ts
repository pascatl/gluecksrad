import { useEffect } from "react";

export const useBodyScrollLock = (locked: boolean) => {
	useEffect(() => {
		if (!locked || typeof document === "undefined") {
			return;
		}

		const { body, documentElement } = document;
		const previousBodyOverflow = body.style.overflow;
		const previousHtmlOverflow = documentElement.style.overflow;
		const previousBodyTouchAction = body.style.touchAction;

		body.style.overflow = "hidden";
		documentElement.style.overflow = "hidden";
		body.style.touchAction = "none";

		return () => {
			body.style.overflow = previousBodyOverflow;
			documentElement.style.overflow = previousHtmlOverflow;
			body.style.touchAction = previousBodyTouchAction;
		};
	}, [locked]);
};
