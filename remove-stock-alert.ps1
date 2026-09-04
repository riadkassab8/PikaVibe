$path = 'C:\Users\Riadkassab320\OneDrive\Desktop\Home-Goods-Hub\artifacts\pikavibe-store\src\pages\admin\dashboard.tsx'
$content = Get-Content -Path $path -Raw
$replacement = @'
  const saveStock = async (product: ApiProduct, stock: number) => {
    if (!product.backendId) return;
    try {
      await updateProduct(product.backendId, { ...product, stock: Math.max(0, stock), active: product.active !== false });
      await onRefresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'تعذر تحديث المخزون.');
    }
  };

'@
$pattern = '(?s)  const saveStock = async.*?  const toggleActive = async'
$updated = [regex]::Replace($content, $pattern, $replacement + '  const toggleActive = async', 1)
if ($updated -eq $content) { throw 'saveStock block was not found' }
Set-Content -Path $path -Value $updated -Encoding utf8
Write-Output 'STOCK_ALERTS_REMOVED'
