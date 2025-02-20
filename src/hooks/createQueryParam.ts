import { useNavigate } from "@tanstack/react-router";
import { type JsonPrimitive } from "type-fest";

export function createQueryParam<
  Search extends Record<string, JsonPrimitive>,
  Key extends keyof Search,
  Default extends Search[Key],
>(search: Search, key: keyof Search, defaultValue: Default) {
  const navigate = useNavigate();

  const get = search[key] || defaultValue;

  const set = (value: Search[keyof Search]) => {
    navigate({
      // @ts-expect-error the type is complex and not worth the effort
      search: { [key]: value },
    });
  };

  return [get, set] as const;
}
