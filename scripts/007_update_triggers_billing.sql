-- Updated_at triggers for billing tables

DROP TRIGGER IF EXISTS set_updated_at ON public.planos;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.planos
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.assinaturas;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.assinaturas
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
