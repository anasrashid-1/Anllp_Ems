import React, { useContext, useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Alert, ActivityIndicator, Button, TouchableOpacity } from 'react-native';
import { Table, Row } from 'react-native-table-component';
import COLORS from '../constants/colors';
import { AuthContext } from '../store/auth-context';
import { useIsFocused, useNavigation } from '@react-navigation/native';

interface SalesLeadData {
    firmname: string;
    groweraddress: string;
    growerreference: string;
    leadtype: string;
    growercell: string;
    areakanal: string;
    areamarla: string;
    sitelocation: string;
    latitude: string;
    longitude: string;
}

interface Pagination {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
}

const SalesLeadScreen: React.FC = () => {
    const [salesLeads, setSalesLeads] = useState<SalesLeadData[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: 0,
        totalCount: 0,
        totalPages: 0,
    });

    const navigation = useNavigation();
    const authCtx = useContext(AuthContext);

    const fetchSalesLeads = async (page: number) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${authCtx.apiUrl}/saleslead/?page=${page}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${authCtx.token}`,
                },
            });

            if (!response.ok) {
                const result = await response.json();
                Alert.alert(result.message || 'Failed to fetch sales leads.');
                return;
            }

            const result = await response.json();
            setSalesLeads(result.data);
            setPagination(result.pagination);
        } catch (error: any) {
            Alert.alert(error.message || 'An error occurred while fetching sales leads.');
        } finally {
            setIsLoading(false);
        }
    };

    const isFocused = useIsFocused()

    useEffect(() => {
        fetchSalesLeads(pagination.page);
    }, [authCtx.apiUrl, authCtx.token, pagination.page, isFocused]);

    const handleNextPage = () => {
        if (pagination.page < pagination.totalPages) {
            setPagination((prev) => ({ ...prev, page: prev.page + 1 }));
        }
    };

    const handlePreviousPage = () => {
        if (pagination.page > 1) {
            setPagination((prev) => ({ ...prev, page: prev.page - 1 }));
        }
    };

    const tableHead = [
        'Firm Name',
        'Grower Address',
        'Reference',
        'Lead Type',
        'Phone',
        'Site Location',
        'Action',
    ];

    const tableData = salesLeads.map((lead) => [
        lead.firmname,
        lead.groweraddress,
        lead.growerreference,
        lead.leadtype,
        lead.growercell,
        lead.sitelocation,
    ]);

    const handleActionPress = (rowData: SalesLeadData) => {
        navigation.navigate('Add Sales Lead', { rowData });
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Sales Leads</Text>

            {isLoading ? (
                <ActivityIndicator size="large" color={COLORS.ACCENT_ORANGE} />
            ) : (
                <ScrollView>
                    {tableData.length > 0 ? (
                        <ScrollView horizontal>
                            <View>
                                <Table borderStyle={{ borderWidth: 2, borderColor: COLORS.DARK_GRAY, }}>
                                    <Row data={tableHead} style={styles.header} textStyle={styles.headerText} />
                                </Table>
                                {tableData.map((rowData, rowIndex) => (
                                    <View key={rowIndex} style={styles.row}>
                                        {rowData.map((value, cellIndex) => (
                                            <View key={cellIndex} style={styles.cell}>
                                                <Text style={styles.rowText}>{value ?? 'N/A'}</Text>
                                            </View>
                                        ))}
                                        <View style={styles.cell}>
                                            <TouchableOpacity
                                                style={[styles.button, { backgroundColor: COLORS.ACCENT_ORANGE }]}
                                                onPress={() => handleActionPress(salesLeads[rowIndex])}
                                            >
                                                <Text style={styles.buttonText}>Edit</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ))}
                            </View>
                        </ScrollView>
                    ) : (
                        <Text style={styles.placeholderText}>
                            🚀 No sales data available yet. Please add some sales leads to get started.
                        </Text>
                    )}
                </ScrollView>
            )}

            <View style={styles.paginationContainer}>
                <Button
                    title="Previous"
                    onPress={handlePreviousPage}
                    disabled={pagination.page === 1}
                    color={COLORS.DARK_GRAY}
                />
                <Text style={styles.paginationText}>
                    Page {pagination.page} of {pagination.totalPages}
                </Text>
                <Button
                    title="Next"
                    onPress={handleNextPage}
                    color={COLORS.ACCENT_ORANGE}
                    disabled={pagination.page === pagination.totalPages}
                />
            </View>
        </View>
    );
};

export default SalesLeadScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        padding: 16,
    },
    placeholderText: {
        fontSize: 14,
        color: COLORS.DARK_GRAY,
        marginTop: 50,
    },
    button: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
        borderRadius: 5,
        width: 100,
    },
    buttonText: {
        color: 'white',
    },
    row: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderColor: COLORS.DARK_GRAY,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: COLORS.DARK_GRAY,
        marginBottom: 16,
    },
    cell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderColor: COLORS.DARK_GRAY,
    },
    header: {
        height: 40, backgroundColor: COLORS.ACCENT_ORANGE,
    },
    headerText: { padding: 6, width: 150 },
    rowText: {
        textAlign: 'center',
        fontSize: 12,
        color: COLORS.DARK_GRAY,
        paddingVertical: 6,
        width: 100,
    },

    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
    },
    paginationText: {
        fontSize: 14,
        color: COLORS.DARK_GRAY,
    },
});
