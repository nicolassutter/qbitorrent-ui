import { useNavigate, useSearch } from "@tanstack/react-router";
import { type JsonPrimitive, LiteralToPrimitive } from "type-fest";

export function createQueryParam<
  T extends JsonPrimitive,
  Primitive extends LiteralToPrimitive<T> = LiteralToPrimitive<T>,
>(
  key: string,
): readonly [
  () => Primitive | undefined,
  (value: Primitive | null | undefined) => void,
];

export function createQueryParam<
  T extends JsonPrimitive,
  Primitive extends LiteralToPrimitive<T> = LiteralToPrimitive<T>,
>(
  key: string,
  defaultValue: T,
): readonly [() => Primitive, (value: Primitive | null | undefined) => void];

export function createQueryParam<
  T extends JsonPrimitive,
  Primitive extends LiteralToPrimitive<T> = LiteralToPrimitive<T>,
>(key: string, defaultValue?: T) {
  const search = useSearch({
    strict: false,
  });
  const navigate = useNavigate({});

  const get = () => (search[key] as Primitive) || (defaultValue as Primitive);

  const set = (value: Primitive) => {
    navigate({
      search: () => ({ [key]: value }),
    });
  };

  return [get, set] as const;
}
