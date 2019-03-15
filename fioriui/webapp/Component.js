jQuery.sap.declare("fioriui.Component");
sap.ui.getCore().loadLibrary("sap.ui.generic.app");
jQuery.sap.require("sap.ui.generic.app.AppComponent");

sap.ui.generic.app.AppComponent.extend("fioriui.Component", {
	metadata: {
		"manifest": "json"
	}
});