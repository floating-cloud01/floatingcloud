package charles.ysc;

import java.util.HashMap;
import java.util.Map;

import com.sap.cloud.sdk.service.prov.api.DataSourceHandler;
import com.sap.cloud.sdk.service.prov.api.EntityData;
import com.sap.cloud.sdk.service.prov.api.ExtensionHelper;
import com.sap.cloud.sdk.service.prov.api.exception.DatasourceException;
import com.sap.cloud.sdk.service.prov.api.operations.Create;
import com.sap.cloud.sdk.service.prov.api.request.CreateRequest;
import com.sap.cloud.sdk.service.prov.api.response.CreateResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class MainMenuService {
	
	public static final Logger LOG = LoggerFactory.getLogger(MainMenuService.class.getName());
	
	@Create(entity = "MainMenu", serviceName = "CatalogService")
	public CreateResponse addMainMenu(CreateRequest cr, ExtensionHelper eh) {
		
		String entityName = cr.getEntityMetadata().getName();
		DataSourceHandler dh = eh.getHandler();
		
		Map<String, Object> body = cr.getMapData();
		Map<String, Object> keys = new HashMap<String, Object>();
		keys.put("MenuName", body.get("MenuName"));
		
		EntityData ed = null;
		try {
			ed = dh.executeRead(entityName, keys, cr.getEntityMetadata().getFlattenedElementNames());
			if (ed == null) {
				ed = cr.getData();
				ed = dh.executeInsert(ed, true);
			}
		} catch (DatasourceException e) {
			LOG.error("HANA DB Connection Error");
		} finally {
			return CreateResponse.setSuccess().setData(ed).response();
		}
	}
	
}
