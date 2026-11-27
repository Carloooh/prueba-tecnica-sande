CREATE OR ALTER PROCEDURE dbo.sp_Unificar_Producto
    @id_producto_2 INT,         -- ID Producto Origen (Proveedor secundario)
    @id_entidad_prov_2 INT,     -- ID Proveedor secundario
    @id_producto_1 INT          -- ID Producto Destino (Proveedor principal)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    -- Validar que no se intente unificar un producto consigo mismo
    IF (@id_producto_2 = @id_producto_1)
    BEGIN
        RAISERROR('No es posible unificar un producto consigo mismo.', 16, 1);
        RETURN;
    END

    -- Validar existencia del producto destino
    IF NOT EXISTS (SELECT 1 FROM dbo.Productos WHERE ID_Producto = @id_producto_1)
    BEGIN
        RAISERROR('El producto principal destino no existe.', 16, 1);
        RETURN;
    END

    BEGIN TRANSACTION;

    BEGIN TRY
        -- 1. Ocultar el producto secundario de la vista maestro vinculándolo como hijo
        IF NOT EXISTS (SELECT 1 FROM dbo.TFC_Productos_Agrupados_RGB WHERE id_producto = @id_producto_2)
        BEGIN
            INSERT INTO dbo.TFC_Productos_Agrupados_RGB (id_producto, id_producto_madre, fecha_modificacion)
            VALUES (@id_producto_2, @id_producto_1, GETDATE());
        END
        ELSE
        BEGIN
            UPDATE dbo.TFC_Productos_Agrupados_RGB
            SET id_producto_madre = @id_producto_1,
                fecha_modificacion = GETDATE()
            WHERE id_producto = @id_producto_2;
        END

        -- 2. Registrar en agrupados finales y reasignar dependencias previas si este producto ya era madre
        IF NOT EXISTS (SELECT 1 FROM dbo.TFC_Productos_Agrupados_Finales_RGB WHERE id_producto = @id_producto_2)
        BEGIN
            INSERT INTO dbo.TFC_Productos_Agrupados_Finales_RGB (id_producto, id_producto_madre, fecha_modificacion)
            VALUES (@id_producto_2, @id_producto_1, GETDATE());
        END
        ELSE
        BEGIN
            UPDATE dbo.TFC_Productos_Agrupados_Finales_RGB
            SET id_producto_madre = @id_producto_1,
                fecha_modificacion = GETDATE()
            WHERE id_producto = @id_producto_2;
        END

        UPDATE dbo.TFC_Productos_Agrupados_Finales_RGB
        SET id_producto_madre = @id_producto_1,
            fecha_modificacion = GETDATE()
        WHERE id_producto_madre = @id_producto_2 AND id_producto <> @id_producto_2;

        -- 3. Homologar código del proveedor secundario con el del principal y asignar prioridad 2
        DECLARE @codigo_prod_p_del_1 VARCHAR(50);

        SELECT TOP 1 @codigo_prod_p_del_1 = codigo_prod_p
        FROM dbo.tfc_productos_rgb
        WHERE id_producto_s = @id_producto_1 AND id_prioridad = 1;

        IF (@codigo_prod_p_del_1 IS NULL)
        BEGIN
            SELECT @codigo_prod_p_del_1 = Codigo_Prod FROM dbo.Productos WHERE ID_Producto = @id_producto_1;
        END

        UPDATE dbo.tfc_productos_rgb
        SET id_prioridad = 2,
            codigo_prod_p = @codigo_prod_p_del_1,
            id_producto_a = @id_producto_1,
            id_producto_s = @id_producto_1
        WHERE id_producto_s = @id_producto_2 AND id_entidad = @id_entidad_prov_2;

        -- 4. Traspaso de stock de todas las bodegas hacia el producto principal
        DECLARE @stocke FLOAT = 0, @stockt2 FLOAT = 0, @stockt7 FLOAT = 0, @stockl3 FLOAT = 0;

        SELECT 
            @stocke  = ISNULL(stocke, 0),
            @stockt2 = ISNULL(stockt2, 0),
            @stockt7 = ISNULL(stockt7, 0),
            @stockl3 = ISNULL(stockl3, 0)
        FROM dbo.tfc_vista_maestro_productos_stock
        WHERE id_producto = @id_producto_2;

        IF (@stocke > 0 OR @stockt2 > 0 OR @stockt7 > 0 OR @stockl3 > 0)
        BEGIN
            -- Crear registro de stock para el principal si no existía
            IF NOT EXISTS (SELECT 1 FROM dbo.tfc_vista_maestro_productos_stock WHERE id_producto = @id_producto_1)
            BEGIN
                INSERT INTO dbo.tfc_vista_maestro_productos_stock (id_producto, stocke, stockt2, stockt7, stockl3)
                VALUES (@id_producto_1, 0, 0, 0, 0);
            END

            -- Sumar existencias al producto destino
            UPDATE dbo.tfc_vista_maestro_productos_stock
            SET stocke  = stocke  + @stocke,
                stockt2 = stockt2 + @stockt2,
                stockt7 = stockt7 + @stockt7,
                stockl3 = stockl3 + @stockl3
            WHERE id_producto = @id_producto_1;

            -- Dejar en 0 el stock del producto absorbido
            UPDATE dbo.tfc_vista_maestro_productos_stock
            SET stocke = 0, stockt2 = 0, stockt7 = 0, stockl3 = 0
            WHERE id_producto = @id_producto_2;
        END

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF (XACT_STATE() <> 0)
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR(@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO
